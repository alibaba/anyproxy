'use strict';

import * as async from 'async';
import * as https from 'https';
import * as http from 'http';
import * as tls from 'tls';
import * as crypto from 'crypto';
import * as color from 'colorful';
import * as WebSocket from 'ws';
import * as constants from 'constants';
import * as AsyncTask from 'async-task-mgr';
import certMgr from './certMgr';
import logUtil from './log';
import util from './util';
import wsServerMgr from './wsServerMgr';
import * as co from 'co';

// // manage https servers
// const async = require('async'),
//   https = require('https'),
//   tls = require('tls'),
//   crypto = require('crypto'),
//   color = require('colorful'),
//   certMgr = require('./certMgr'),
//   logUtil = require('./log'),
//   util = require('./util').default,
//   wsServerMgr = require('./wsServerMgr'),
//   co = require('co'),
//   constants = require('constants'),
//   asyncTask = require('async-task-mgr');

declare type THttpsRequestHanlder = (req: http.IncomingMessage, userRes: http.ServerResponse) => void;
declare type TWsRequestHandler = (wsClient: WebSocket, wsReq: http.IncomingMessage) => void;

const createSecureContext = tls.createSecureContext || (crypto as any).createSecureContext;
// using sni to avoid multiple ports
function SNIPrepareCert(
  serverName: string, SNICallback: (error: Error, ctx: tls.SecureContext) => void): void {
  let keyContent;
  let crtContent;
  let ctx;

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
          cert: crtContent,
        });
        callback();
      } catch (e) {
        callback(e);
      }
    },
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

/**
 * Create an https server
 *
 * @param {object} config
 * @param {number} config.port port to start https server
 * @param {function} config.handler  request handler
 */
function createHttpsServer(config: {
  port: number;
  handler: THttpsRequestHanlder;
}): Promise<https.Server> {
  if (!config || !config.port || !config.handler) {
    throw (new Error('please assign a port'));
  }

  return new Promise((resolve) => {
    certMgr.getCertificate('anyproxy_internal_https_server', (err, keyContent, crtContent) => {
      const server = https.createServer({
        secureOptions: constants.SSL_OP_NO_SSLv3 || constants.SSL_OP_NO_TLSv1,
        SNICallback: SNIPrepareCert,
        key: keyContent,
        cert: crtContent,
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
function createIPHttpsServer(config: {
  port: number;
  ip: string;
  handler: THttpsRequestHanlder;
}): Promise<https.Server> {
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
        cert: crtContent,
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
class HttpsServerMgr {
  private instanceDefaultHost: string;
  private httpsAsyncTask: AsyncTask;
  private handler: THttpsRequestHanlder;
  private wsHandler: TWsRequestHandler;
  constructor(config: {
    handler: THttpsRequestHanlder;
    wsHandler: TWsRequestHandler;
  }) {
    if (!config || !config.handler) {
      throw new Error('handler is required');
    }
    this.instanceDefaultHost = '127.0.0.1';
    this.httpsAsyncTask = new AsyncTask();
    this.handler = config.handler;
    this.wsHandler = config.wsHandler;
  }

  public getSharedHttpsServer(hostname: string): Promise<{
      host: string;
      port: number;
    }> {
    // ip address will have a unique name
    const finalHost = util.isIpDomain(hostname) ? hostname : this.instanceDefaultHost;

    const self = this;
    function prepareServer(callback: (e: Error, result?: {
      host: string;
      port: number;
    }) => void): void {
      let instancePort;
      co(util.getFreePort)
        .then(co.wrap(function *(port: number): Generator {
          instancePort = port;
          let httpsServer = null;

          // if ip address passed in, will create an IP http server
          if (util.isIpDomain(hostname)) {
            httpsServer = yield createIPHttpsServer({
              ip: hostname,
              port,
              handler: self.handler,
            });
          } else {
            httpsServer = yield createHttpsServer({
              port,
              handler: self.handler,
            });
          }

          wsServerMgr.getWsServer({
            server: httpsServer,
            connHandler: self.wsHandler,
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
        .catch((e) => {
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

export default HttpsServerMgr;
