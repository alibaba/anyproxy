'use strict';

const express = require('express'),
  url = require('url'),
  bodyParser = require('body-parser'),
  fs = require('fs'),
  path = require('path'),
  events = require('events'),
  qrCode = require('qrcode-npm'),
  util = require('./util'),
  certMgr = require('./certMgr'),
  wsServer = require('./wsServer'),
  juicer = require('juicer'),
  ip = require('ip'),
  compress = require('compression'),
  pug = require('pug');

const DEFAULT_WEB_PORT = 8002; // port for web interface

const packageJson = require('../package.json');

const MAX_CONTENT_SIZE = 1024 * 2000; // 2000kb

const certFileTypes = ['crt', 'cer', 'pem', 'der'];
/**
 *
 *
 * @class webInterface
 * @extends {events.EventEmitter}
 */
class webInterface extends events.EventEmitter {
  /**
   * Creates an instance of webInterface.
   *
   * @param {object} config
   * @param {number} config.webPort
   * @param {object} recorder
   *
   * @memberOf webInterface
   */
  constructor(config, recorder) {
    if (!recorder) {
      throw new Error('recorder is required for web interface');
    }
    super();
    const self = this;
    self.webPort = config.webPort || DEFAULT_WEB_PORT;
    self.recorder = recorder;
    self.config = config || {};

    self.app = this.getServer();
    self.server = null;
    self.wsServer = null;
  }

  /**
   * get the express server
   */
  getServer() {
    const self = this;
    const recorder = self.recorder;
    const ipAddress = ip.address(),
      // userRule = proxyInstance.proxyRule,
      webBasePath = 'web';
    let ruleSummary = '';
    let customMenu = [];

    try {
      ruleSummary = ''; //userRule.summary();
      customMenu = ''; // userRule._getCustomMenu();
    } catch (e) { }

    const staticDir = path.join(__dirname, '../', webBasePath);
    const app = express();

    app.use(compress()); //invoke gzip
    app.use((req, res, next) => {
      res.setHeader('note', 'THIS IS A REQUEST FROM ANYPROXY WEB INTERFACE');
      return next();
    });
    app.use(bodyParser.json());

    app.get('/latestLog', (req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      recorder.getRecords(null, 10000, (err, docs) => {
        if (err) {
          res.end(err.toString());
        } else {
          res.json(docs);
        }
      });
    });

    app.get('/downloadBody', (req, res) => {
      const query = req.query;
      recorder.getDecodedBody(query.id, (err, result) => {
        if (err || !result || !result.content) {
          res.json({});
        } else if (result.mime) {
          if (query.raw === 'true') {
            //TODO : cache query result
            res.type(result.mime).end(result.content);
          } else if (query.download === 'true') {
            res.setHeader('Content-disposition', `attachment; filename=${result.fileName}`);
            res.setHeader('Content-type', result.mime);
            res.end(result.content);
          }
        } else {
          res.json({

          });
        }
      });
    });

    app.get('/fetchBody', (req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      const query = req.query;
      if (query && query.id) {
        recorder.getDecodedBody(query.id, (err, result) => {
          // 返回下载信息
          const _resDownload = function (isDownload) {
            isDownload = typeof isDownload === 'boolean' ? isDownload : true;
            res.json({
              id: query.id,
              type: result.type,
              method: result.meethod,
              fileName: result.fileName,
              ref: `/downloadBody?id=${query.id}&download=${isDownload}&raw=${!isDownload}`
            });
          };

          // 返回内容
          const _resContent = () => {
            if (util.getByteSize(result.content || '') > MAX_CONTENT_SIZE) {
              _resDownload(true);
              return;
            }

            res.json({
              id: query.id,
              type: result.type,
              method: result.method,
              resBody: result.content
            });
          };

          if (err || !result) {
            res.json({});
          } else if (result.statusCode === 200 && result.mime) {
            // deal with 'application/x-javascript' and 'application/javascript'
            if (/json|text|javascript/.test(result.mime)) {
              _resContent();
            } else if (result.type === 'image') {
              _resDownload(false);
            } else {
              _resDownload(true);
            }
          } else {
            _resContent();
          }
        });
      } else {
        res.end('');
      }
    });

    app.get('/fetchReqBody', (req, res) => {
      const query = req.query;
      if (query && query.id) {
        recorder.getSingleRecord(query.id, (err, doc) => {
          if (err || !doc[0]) {
            console.error(err);
            res.end('');
            return;
          }

          res.setHeader('Content-disposition', `attachment; filename=request_${query.id}_body.txt`);
          res.setHeader('Content-type', 'text/plain');
          res.end(doc[0].reqBody);
        });
      } else {
        res.end('');
      }
    });

    app.get('/fetchWsMessages', (req, res) => {
      const query = req.query;
      if (query && query.id) {
        recorder.getDecodedWsMessage(query.id, (err, messages) => {
          if (err) {
            console.error(err);
            res.json([]);
            return;
          }
          res.json(messages);
        });
      } else {
        res.json([]);
      }
    });

    app.get('/downloadCrt', (req, res) => {
      const pageFn = pug.compileFile(path.join(__dirname, '../resource/cert_download.pug'));
      res.end(pageFn({ ua: req.get('user-agent') }));
    });

    app.get('/fetchCrtFile', (req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      const _crtFilePath = certMgr.getRootCAFilePath();
      if (_crtFilePath) {
        const fileType = certFileTypes.indexOf(req.query.type) !== -1 ? req.query.type : 'crt';
        res.setHeader('Content-Type', 'application/x-x509-ca-cert');
        res.setHeader('Content-Disposition', `attachment; filename="rootCA.${fileType}"`);
        res.end(fs.readFileSync(_crtFilePath, { encoding: null }));
      } else {
        res.setHeader('Content-Type', 'text/html');
        res.end('can not file rootCA ,plase use <strong>anyproxy --root</strong> to generate one');
      }
    });

    app.get('/api/getQrCode', (req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');

      const qr = qrCode.qrcode(4, 'M');
      const targetUrl = req.protocol + '://' + req.get('host') + '/downloadCrt';
      const isRootCAFileExists = certMgr.isRootCAFileExists();

      qr.addData(targetUrl);
      qr.make();

      res.json({
        status: 'success',
        url: targetUrl,
        isRootCAFileExists,
        qrImgDom: qr.createImgTag(4)
      });
    });

    // response init data
    app.get('/api/getInitData', (req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      const rootCAExists = certMgr.isRootCAFileExists();
      const rootDirPath = certMgr.getRootDirPath();
      const interceptFlag = false; //proxyInstance.getInterceptFlag(); TODO
      const globalProxyFlag = false; // TODO: proxyInstance.getGlobalProxyFlag();
      res.json({
        status: 'success',
        rootCAExists,
        rootCADirPath: rootDirPath,
        currentInterceptFlag: interceptFlag,
        currentGlobalProxyFlag: globalProxyFlag,
        ruleSummary: ruleSummary || '',
        ipAddress: util.getAllIpAddress(),
        port: '', //proxyInstance.proxyPort, // TODO
        appVersion: packageJson.version
      });
    });

    app.post('/api/generateRootCA', (req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      const rootExists = certMgr.isRootCAFileExists();
      if (!rootExists) {
        certMgr.generateRootCA(() => {
          res.json({
            status: 'success',
            code: 'done'
          });
        });
      } else {
        res.json({
          status: 'success',
          code: 'root_ca_exists'
        });
      }
    });

    app.use((req, res, next) => {
      const indexTpl = fs.readFileSync(path.join(staticDir, '/index.html'), { encoding: 'utf8' }),
        opt = {
          rule: ruleSummary || '',
          customMenu: customMenu || [],
          ipAddress: ipAddress || '127.0.0.1'
        };

      if (url.parse(req.url).pathname === '/') {
        res.setHeader('Content-Type', 'text/html');
        res.end(juicer(indexTpl, opt));
      } else {
        next();
      }
    });
    app.use(express.static(staticDir));
    return app;
  }

  start() {
    const self = this;
    return new Promise((resolve, reject) => {
      self.server = self.app.listen(self.webPort);
      self.wsServer = new wsServer({
        server: self.server
      }, self.recorder);
      self.wsServer.start();
      resolve();
    })
  }

  close() {
    const self = this;
    return new Promise((resolve, reject) => {
      self.server && self.server.close();
      self.wsServer && self.wsServer.closeAll();
      self.server = null;
      self.wsServer = null;
      self.proxyInstance = null;
      resolve();
    });
  }
}

module.exports = webInterface;
