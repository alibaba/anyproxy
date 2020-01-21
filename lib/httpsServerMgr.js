'use strict'

//manage https servers
const async = require('async'),
  https = require('https'),
  tls = require('tls'),
  crypto = require('crypto'),
  color = require('colorful'),
  certMgr = require('./certMgr'),
  logUtil = require('./log'),
  util = require('./util'),
  wsServerMgr = require('./wsServerMgr'),
  co = require('co'),
  assert = require('assert'),
  constants = require('constants'),
  asyncTask = require('async-task-mgr');

const createSecureContext = tls.createSecureContext || crypto.createSecureContext;
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
    const server = https.createServer({
      secureOptions: constants.SSL_OP_NO_SSLv3 || constants.SSL_OP_NO_TLSv1,
      SNICallback: SNIPrepareCert,
    }, config.handler).listen(config.port);
    resolve(server);
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
    assert(config, 'config is required');
    assert(config.handler && config.wsHandler, 'handler and wsHandler are required');
    assert(config.hostname, 'hostname is required');
    this.hostname = config.hostname;
    this.handler = config.handler;
    this.wsHandler = config.wsHandler;
    this.httpsAsyncTask = new asyncTask();
    this.asyncTaskName = `https_${Math.random()}`;
    this.httpsServer = null;
  }

  getSharedHttpsServer() {
    const self = this;
    const finalHost = self.hostname;
    function prepareServer(callback) {
      let instancePort;
      co(util.getFreePort)
        .then(co.wrap(function *(port) {
          instancePort = port;
          let httpsServer = null;

          httpsServer = yield createHttpsServer({
            port,
            handler: self.handler
          });

          wsServerMgr.getWsServer({
            server: httpsServer,
            connHandler: self.wsHandler
          });

          httpsServer.on('upgrade', (req, cltSocket, head) => {
            logUtil.debug('will let WebSocket server to handle the upgrade event');
          });

          self.httpsServer = httpsServer;

          const result = {
            host: finalHost,
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
      self.httpsAsyncTask.addTask(self.asyncTaskName, prepareServer, (error, serverInfo) => {
        if (error) {
          reject(error);
        } else {
          resolve(serverInfo);
        }
      });
    });
  }

  close() {
    return this.httpsServer && this.httpsServer.close();
  }
}

module.exports = httpsServerMgr;
