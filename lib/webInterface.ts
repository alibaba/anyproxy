'use strict';

const DEFAULT_WEB_PORT = 8002; // port for web interface

import * as express from 'express';
import * as url from 'url';
import * as bodyParser from 'body-parser';
import * as fs from 'fs';
import * as path from 'path';
import * as events from 'events';
import * as qrCode from 'qrcode-npm';
import * as juicer from 'juicer';
import * as ip from 'ip';
import * as http from 'http';
import * as compress from 'compression';
import * as buffer from 'buffer';
import util from './util';
import certMgr from './certMgr';
import WsServer from './wsServer';
import Recorder from './recorder';
import LogUtil from './log';

/*tslint:disable:no-var-requires*/
const packageJson = require('../package.json');

// const express = require('express'),
//   url = require('url'),
//   bodyParser = require('body-parser'),
//   fs = require('fs'),
//   path = require('path'),
//   events = require('events'),
//   qrCode = require('qrcode-npm'),
//   util = require('./util').default,
//   certMgr = require('./certMgr').default,
//   wsServer = require('./wsServer'),
//   juicer = require('juicer'),
//   ip = require('ip'),
//   compress = require('compression');

// const packageJson = require('../package.json');

const Buffer = buffer.Buffer;
const MAX_CONTENT_SIZE = 1024 * 2000; // 2000kb
/**
 *
 *
 * @class webInterface
 * @extends {events.EventEmitter}
 */
class WebInterface extends events.EventEmitter {
  public webPort: number;
  private recorder: Recorder;
  private app: Express.Application;
  private server: http.Server;
  private wsServer: WsServer;
  constructor(config: AnyProxyWebInterfaceConfig, recorder: Recorder) {
    if (!recorder) {
      throw new Error('recorder is required for web interface');
    }
    super();
    const self = this;
    self.webPort = config.webPort || DEFAULT_WEB_PORT;
    self.recorder = recorder;
    // self.config = config || {};

    self.app = this.getServer();
    self.server = null;
    self.wsServer = null;
  }

  /**
   * get the express server
   */
  public getServer(): Express.Application {
    const self = this;
    const recorder = self.recorder;
    const ipAddress = ip.address();
      // userRule = proxyInstance.proxyRule,
    const webBasePath = 'web';
    let ruleSummary = '';
    let customMenu = [];

    try {
      ruleSummary = ''; // userRule.summary();
      customMenu = []; // userRule._getCustomMenu();
    } catch (e) { LogUtil.error(e.stack); }

    const myAbsAddress = 'http://' + ipAddress + ':' + self.webPort + '/';
    const staticDir = path.join(__dirname, '../', webBasePath);

    const app = express();
    app.use(compress()); // invoke gzip
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
      recorder.getDecodedBody(parseInt(query.id, 10), (err, result) => {
        if (err || !result || !result.content) {
          res.json({});
        } else if (result.mime) {
          if (query.raw === 'true') {
            // TODO : cache query result
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
        recorder.getDecodedBody(parseInt(query.id, 10), (err, result) => {
          // 返回下载信息
          const resDownload = function(isDownload: boolean): void {
            isDownload = typeof isDownload === 'boolean' ? isDownload : true;
            res.json({
              id: query.id,
              type: result.type,
              method: result.method,
              fileName: result.fileName,
              ref: `/downloadBody?id=${query.id}&download=${isDownload}&raw=${!isDownload}`,
            });
          };

          // 返回内容
          const resContent = () => {
            if (util.getByteSize(result.content || Buffer.from('')) > MAX_CONTENT_SIZE) {
              resDownload(true);
              return;
            }

            res.json({
              id: query.id,
              type: result.type,
              method: result.method,
              resBody: result.content,
            });
          };

          if (err || !result) {
            res.json({});
          } else if (result.statusCode === 200 && result.mime) {
            if (result.type === 'json' ||
              result.mime.indexOf('text') === 0 ||
              // deal with 'application/x-javascript' and 'application/javascript'
              result.mime.indexOf('javascript') > -1) {
              resContent();
            } else if (result.type === 'image') {
              resDownload(false);
            } else {
              resDownload(true);
            }
          } else {
            resContent();
          }
        });
      } else {
        res.end({});
      }
    });

    app.get('/fetchReqBody', (req, res) => {
      const query = req.query;
      if (query && query.id) {
        recorder.getSingleRecord(parseInt(query.id, 10), (err, doc) => {
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
        recorder.getDecodedWsMessage(parseInt(query.id, 10), (err, messages) => {
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

    app.get('/fetchCrtFile', (req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      const crtFilePath = certMgr.getRootCAFilePath();
      if (crtFilePath) {
        res.setHeader('Content-Type', 'application/x-x509-ca-cert');
        res.setHeader('Content-Disposition', 'attachment; filename="rootCA.crt"');
        res.end(fs.readFileSync(crtFilePath, { encoding: null }));
      } else {
        res.setHeader('Content-Type', 'text/html');
        res.end('can not file rootCA ,plase use <strong>anyproxy --root</strong> to generate one');
      }
    });

    // make qr code
    app.get('/qr', (req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      const qr = qrCode.qrcode(4, 'M');
      const targetUrl = myAbsAddress;
      qr.addData(targetUrl);
      qr.make();
      const qrImageTag = qr.createImgTag(4);
      const resDom = '<a href="__url"> __img <br> click or scan qr code to start client </a>'
        .replace(/__url/, targetUrl).replace(/__img/, qrImageTag);
      res.setHeader('Content-Type', 'text/html');
      res.end(resDom);
    });

    app.get('/api/getQrCode', (req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      const qr = qrCode.qrcode(4, 'M');
      const targetUrl = myAbsAddress + 'fetchCrtFile';

      qr.addData(targetUrl);
      qr.make();
      const qrImageTag = qr.createImgTag(4);

      // resDom = '<a href="__url"> __img <br> click or scan qr code to download rootCA.crt </a>'
      // .replace(/__url/,targetUrl).replace(/__img/,qrImageTag);
      // res.setHeader("Content-Type", "text/html");
      // res.end(resDom);

      const isRootCAFileExists = certMgr.ifRootCAFileExists();
      res.json({
        status: 'success',
        url: targetUrl,
        isRootCAFileExists,
        qrImgDom: qrImageTag,
      });
    });

    // response init data
    app.get('/api/getInitData', (req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      const rootCAExists = certMgr.isRootCAFileExists();
      const rootDirPath = certMgr.getRootDirPath();
      const interceptFlag = false; // proxyInstance.getInterceptFlag(); TODO
      const globalProxyFlag = false; // TODO: proxyInstance.getGlobalProxyFlag();
      res.json({
        status: 'success',
        rootCAExists,
        rootCADirPath: rootDirPath,
        currentInterceptFlag: interceptFlag,
        currentGlobalProxyFlag: globalProxyFlag,
        ruleSummary: ruleSummary || '',
        ipAddress: util.getAllIpAddress(),
        port: '', // proxyInstance.proxyPort, // TODO
        appVersion: packageJson.version,
      });
    });

    app.post('/api/generateRootCA', (req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      const rootExists = certMgr.isRootCAFileExists();
      if (!rootExists) {
        certMgr.generateRootCA(() => {
          res.json({
            status: 'success',
            code: 'done',
          });
        });
      } else {
        res.json({
          status: 'success',
          code: 'root_ca_exists',
        });
      }
    });

    app.use((req, res, next) => {
      const indexTpl = fs.readFileSync(path.join(staticDir, '/index.html'), { encoding: 'utf8' });
      const opt = {
          rule: ruleSummary || '',
          customMenu: customMenu || [],
          ipAddress: ipAddress || '127.0.0.1',
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

  public start(): Promise<undefined> {
    const self = this;
    return new Promise((resolve, reject) => {
      self.server = (self.app as any).listen(self.webPort);
      self.wsServer = new WsServer({
        server: self.server,
      }, self.recorder);
      self.wsServer.start();
      resolve();
    });
  }

  public close(cb: (error: Error) => void): void {
    this.server && this.server.close();
    this.wsServer && this.wsServer.closeAll();
    this.server = null;
    this.wsServer = null;
    // this.proxyInstance = null;
  }
}

export default WebInterface;
