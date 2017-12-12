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
  constants = require('constants'),
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
        secureOptions: constants.SSL_OP_NO_SSLv3 || constants.SSL_OP_NO_TLSv1,
        SNICallback: SNIPrepareCert,
        key: keyContent,
        cert: crtContent
      }, config.handler).listen(config.port);
      resolve(server);
    });
  });
}

/**
* create an https server that serving on IP address
* @param @required {object} config
* @param @required {string} config.ip the IP address of the server
* @param @required {number} config.port the port to listen on
* @param @required {function} handler the handler of each connect
*/
function createIPHttpsServer(config) {
  if (!config || !config.port || !config.handler) {
    throw (new Error('please assign a port'));
  }

  if (!config.ip) {
    throw (new Error('please assign an IP to create the https server'));
  }

  return new Promise((resolve) => {
    certMgr.getCertificate(config.ip, (err, keyContent, crtContent) => {
      const server = https.createServer({
        secureOptions: constants.SSL_OP_NO_SSLv3 || constants.SSL_OP_NO_TLSv1,
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
    this.instanceDefaultHost = '127.0.0.1';
    this.httpsAsyncTask = new asyncTask();
    this.handler = config.handler;
    this.wsHandler = config.wsHandler
  }

  getSharedHttpsServer(hostname) {
    // ip address will have a unique name
    const finalHost = util.isIpDomain(hostname) ? hostname : this.instanceDefaultHost;

    const self = this;
    function prepareServer(callback) {
      let instancePort;
      co(util.getFreePort)
        .then(co.wrap(function *(port) {
          instancePort = port;
          let httpsServer = null;

          // if ip address passed in, will create an IP http server
          if (util.isIpDomain(hostname)) {
            httpsServer = yield createIPHttpsServer({
              ip: hostname,
              port,
              handler: self.handler
            });
          } else {
            httpsServer = yield createHttpsServer({
              port,
              handler: self.handler
            });
          }

          wsServerMgr.getWsServer({
            server: httpsServer,
            connHandler: self.wsHandler
          });

          httpsServer.on('upgrade', (req, cltSocket, head) => {
            logUtil.debug('will let WebSocket server to handle the upgrade event');
          });

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
      // each ip address will gain a unit task name,
      // while the domain address will share a common task name
      self.httpsAsyncTask.addTask(`createHttpsServer-${finalHost}`, prepareServer, (error, serverInfo) => {
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
