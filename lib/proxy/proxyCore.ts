'use strict';
/*tslint:disable:max-line-length */

import * as http from 'http';
import * as https from 'https';
import * as async from 'async';
import * as color from 'colorful';
import * as events from 'events';
import * as throttle from 'stream-throttle';
import * as co from 'co';
import certMgr from '../certMgr';
import Recorder from '../recorder';
import logUtil from '../log';
import util from '../util';
import RequestHandler from '../requestHandler';
import wsServerMgr from '../wsServerMgr';
import WebInterface from '../webInterface';

declare type TSyncTaskCb = (err: Error) => void;

const ThrottleGroup = throttle.ThrottleGroup;

const T_TYPE_HTTP = 'http';
const T_TYPE_HTTPS = 'https';
const DEFAULT_TYPE = T_TYPE_HTTP;

const PROXY_STATUS_INIT = 'INIT';
const PROXY_STATUS_READY = 'READY';
const PROXY_STATUS_CLOSED = 'CLOSED';

/**
 *
 * @class ProxyCore
 * @extends {events.EventEmitter}
 */
class ProxyCore extends events.EventEmitter {
  private socketIndex: number;
  private status: 'INIT' | 'READY' | 'CLOSED';
  private proxyPort: string;
  private proxyType: 'http' | 'https';
  protected proxyHostName: string;
  public recorder: Recorder;
  private httpProxyServer: http.Server | https.Server;
  protected webServerInstance: WebInterface;
  private requestHandler: RequestHandler;
  private proxyRule: AnyProxyRule;
  private socketPool: {
    [key: string]: http.IncomingMessage;
  };
  /**
   * Creates an instance of ProxyCore.
   * @memberOf ProxyCore
   */
  constructor(config: AnyProxyConfig) {
    super();
    config = config || {};

    this.status = PROXY_STATUS_INIT;
    this.proxyPort = config.port;
    this.proxyType = /https/i.test(config.type || DEFAULT_TYPE) ? T_TYPE_HTTPS : T_TYPE_HTTP;
    this.proxyHostName = config.hostname || 'localhost';
    this.recorder = config.recorder;

    if (parseInt(process.versions.node.split('.')[0], 10) < 4) {
      throw new Error('node.js >= v4.x is required for anyproxy');
    } else if (config.forceProxyHttps && !certMgr.ifRootCAFileExists()) {
      logUtil.printLog('You can run `anyproxy-ca` to generate one root CA and then re-run this command');
      throw new Error('root CA not found. Please run `anyproxy-ca` to generate one first.');
    } else if (this.proxyType === T_TYPE_HTTPS && !config.hostname) {
      throw new Error('hostname is required in https proxy');
    } else if (!this.proxyPort) {
      throw new Error('proxy port is required');
    } else if (!this.recorder) {
      throw new Error('recorder is required');
    } else if (config.forceProxyHttps && config.rule && config.rule.beforeDealHttpsRequest) {
      logUtil.printLog('both "-i(--intercept)" and rule.beforeDealHttpsRequest are specified, the "-i" option will be ignored.', logUtil.T_WARN);
      config.forceProxyHttps = false;
    }

    this.httpProxyServer = null;
    this.requestHandler = null;

    // copy the rule to keep the original proxyRule independent
    this.proxyRule = config.rule || {};

    if (config.silent) {
      logUtil.setPrintStatus(false);
    }

    if (config.throttle) {
      logUtil.printLog('throttle :' + config.throttle + 'kb/s');
      const rate = parseInt(config.throttle, 10);
      if (rate < 1) {
        throw new Error('Invalid throttle rate value, should be positive integer');
      }
      global._throttle = new ThrottleGroup({ rate: 1024 * rate }); // rate - byte/sec
    }

    // init recorder
    this.recorder = config.recorder;

    // init request handler
    const RequestHandlerClass = (util.freshRequire('./requestHandler') as any).default;
    this.requestHandler = new RequestHandlerClass({
      wsIntercept: config.wsIntercept,
      httpServerPort: config.port, // the http server port for http proxy
      forceProxyHttps: !!config.forceProxyHttps,
      dangerouslyIgnoreUnauthorized: !!config.dangerouslyIgnoreUnauthorized,
    }, this.proxyRule, this.recorder);
  }

  /**
  * manage all created socket
  * for each new socket, we put them to a map;
  * if the socket is closed itself, we remove it from the map
  * when the `close` method is called, we'll close the sockes before the server closed
  *
  * @param {Socket} the http socket that is creating
  * @returns undefined
  * @memberOf ProxyCore
  */
  private handleExistConnections(socket: http.IncomingMessage): void {
    const self = this;
    self.socketIndex ++;
    const key = `socketIndex_${self.socketIndex}`;
    self.socketPool[key] = socket;

    // if the socket is closed already, removed it from pool
    socket.on('close', () => {
      delete self.socketPool[key];
    });
  }
  /**
   * start the proxy server
   *
   * @returns ProxyCore
   *
   * @memberOf ProxyCore
   */
  public start(): ProxyCore {
    const self = this;
    self.socketIndex = 0;
    self.socketPool = {};

    if (self.status !== PROXY_STATUS_INIT) {
      throw new Error('server status is not PROXY_STATUS_INIT, can not run start()');
    }
    async.series(
      [
        // creat proxy server
        function(callback: TSyncTaskCb): void {
          if (self.proxyType === T_TYPE_HTTPS) {
            certMgr.getCertificate(self.proxyHostName, (err, keyContent, crtContent) => {
              if (err) {
                callback(err);
              } else {
                self.httpProxyServer = https.createServer({
                  key: keyContent,
                  cert: crtContent,
                }, self.requestHandler.userRequestHandler);
                callback(null);
              }
            });
          } else {
            self.httpProxyServer = http.createServer(self.requestHandler.userRequestHandler);
            callback(null);
          }
        },

        // handle CONNECT request for https over http
        function(callback: TSyncTaskCb): void {
          self.httpProxyServer.on('connect', self.requestHandler.connectReqHandler);

          callback(null);
        },

        function(callback: TSyncTaskCb): void {
          wsServerMgr.getWsServer({
            server: self.httpProxyServer,
            connHandler: self.requestHandler.wsHandler,
          });
          // remember all sockets, so we can destory them when call the method 'close';
          self.httpProxyServer.on('connection', (socket) => {
            self.handleExistConnections.call(self, socket);
          });
          callback(null);
        },

        // start proxy server
        function(callback: TSyncTaskCb): void {
          self.httpProxyServer.listen(self.proxyPort);
          callback(null);
        },
      ],

      // final callback
      (err, result) => {
        if (!err) {
          const tipText = (self.proxyType === T_TYPE_HTTP ? 'Http' : 'Https') + ' proxy started on port ' + self.proxyPort;
          logUtil.printLog(color.green(tipText));

          if (self.webServerInstance) {
            const webTip = 'web interface started on port ' + self.webServerInstance.webPort;
            logUtil.printLog(color.green(webTip));
          }

          let ruleSummaryString = '';
          const ruleSummary = this.proxyRule.summary;
          if (ruleSummary) {
            co(function *(): Generator {
              if (typeof ruleSummary === 'string') {
                ruleSummaryString = ruleSummary;
              } else {
                ruleSummaryString = yield ruleSummary();
              }

              logUtil.printLog(color.green(`Active rule is: ${ruleSummaryString}`));
            });
          }

          self.status = PROXY_STATUS_READY;
          self.emit('ready');
        } else {
          const tipText = 'err when start proxy server :(';
          logUtil.printLog(color.red(tipText), logUtil.T_ERR);
          logUtil.printLog(err, logUtil.T_ERR);
          self.emit('error', {
            error: err,
          });
        }
      },
    );

    return self;
  }


  /**
   * close the proxy server
   *
   * @returns ProxyCore
   *
   * @memberOf ProxyCore
   */
  public close(): Promise<Error> {
    // clear recorder cache
    return new Promise((resolve) => {
      if (this.httpProxyServer) {
        // destroy conns & cltSockets when closing proxy server
        this.requestHandler.conns.forEach((conn, key) => {
          logUtil.printLog(`destorying https connection : ${key}`);
          conn.end();
        });

        this.requestHandler.cltSockets.forEach((cltSocket, key) => {
          logUtil.printLog(`endding https cltSocket : ${key}`);
          cltSocket.end();
        });

        // for (const connItem of this.requestHandler.conns) {
        //   const key = connItem[0];
        //   const conn = connItem[1];
        //   logUtil.printLog(`destorying https connection : ${key}`);
        //   conn.end();
        // }

        // for (const cltSocketItem of this.requestHandler.cltSockets) {
        //   const key = cltSocketItem[0];
        //   const cltSocket = cltSocketItem[1];
        //   logUtil.printLog(`endding https cltSocket : ${key}`);
        //   cltSocket.end();
        // }

        if (this.socketPool) {
          for (const key in this.socketPool) {
            this.socketPool[key].destroy();
          }
        }

        this.httpProxyServer.close((error) => {
          if (error) {
            console.error(error);
            logUtil.printLog(`proxy server close FAILED : ${error.message}`, logUtil.T_ERR);
          } else {
            this.httpProxyServer = null;

            this.status = PROXY_STATUS_CLOSED;
            logUtil.printLog(`proxy server closed at ${this.proxyHostName}:${this.proxyPort}`);
          }
          resolve(error);
        });
      } else {
        resolve();
      }
    });
  }
}

export default ProxyCore;
