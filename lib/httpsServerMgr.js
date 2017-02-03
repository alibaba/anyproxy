//manage https servers
const async = require('async'),
  https = require('https'),
  tls = require('tls'),
  crypto = require('crypto'),
  color = require('colorful'),
  certMgr = require('./certMgr'),
  logUtil = require('./log'),
  util = require('./util'),
  co = require('co'),
  asyncTask = require('async-task-mgr');

const createSecureContext = tls.createSecureContext || crypto.createSecureContext;

//using sni to avoid multiple ports
function SNIPrepareCert(serverName, SNICallback) {
  let keyContent, 
    crtContent, 
    ctx;

  async.series([
    (callback) => {
      certMgr.getCertificate(serverName, (err, key, crt) => {
        if (err) {
          callback(err);
        } else {
          keyContent = key;
          crtContent = crt;
          callback();
        }
      });
    },
    (callback) => {
      try {
        ctx = createSecureContext({
          key: keyContent,
          cert: crtContent
        });
        callback();
      } catch (e) {
        callback(e);
      }
    }
  ], (err) => {
    if (!err) {
      const tipText = 'proxy server for __NAME established'.replace('__NAME', serverName);
      logUtil.printLog(color.yellow(color.bold('[internal https]')) + color.yellow(tipText));
      SNICallback(null, ctx);
    } else {
      logUtil.printLog('err occurred when prepare certs for SNI - ' + err, logUtil.T_ERR);
      logUtil.printLog('err occurred when prepare certs for SNI - ' + err.stack, logUtil.T_ERR);
      logUtil.printLog('you may upgrade your Node.js to >= v0.12', logUtil.T_ERR);
    }
  });
}

//config.port - port to start https server
//config.handler - request handler


/**
 * Create an https server
 * 
 * @param {object} config
 * @param {number} config.port
 * @param {function} config.handler
 */
function createHttpsServer(config) {
  if (!config || !config.port || !config.handler) {
    throw (new Error('please assign a port'));
  }

  return new Promise((resolve) => {
    certMgr.getCertificate('anyproxy_internal_https_server', (err, keyContent, crtContent) => {
      const server = https.createServer({
        SNICallback: SNIPrepareCert,
        key: keyContent,
        cert: crtContent
      }, config.handler).listen(config.port);

      resolve(server);
    });
  });
}

/**
 * 
 * 
 * @class httpsServerMgr
 * @param {object} config
 * @param {function} config.handler handler to deal https request
 * 
 */
class httpsServerMgr {
  constructor(config) {
    if (!config || !config.handler) {
      throw new Error('handler is required');
    }
    this.instanceHost = '127.0.0.1';
    this.httpsAsyncTask = new asyncTask();
    this.handler = config.handler;
  }

  getSharedHttpsServer() {
    const self = this;
    function prepareServer(callback) {
      let instancePort;
      co(util.getFreePort)
        .then(co.wrap(function* (port) {
          instancePort = port;
          yield createHttpsServer({
            port,
            handler: self.handler
          });
          const result = {
            host: self.instanceHost,
            port: instancePort,
          };
          callback(null, result);
          return result;
        }))
        .catch(e => {
          callback(e);
        });
    }

    return new Promise((resolve, reject) => {
      self.httpsAsyncTask.addTask('createHttpsServer', prepareServer, (error, serverInfo) => {
        if (error) {
          reject(error);
        } else {
          resolve(serverInfo);
        }
      });
    });
  }
}

module.exports = httpsServerMgr;
