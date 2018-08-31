'use strict';

import ProxyCore from './proxyCore.js';
import Recorder from '../recorder';
import WebInterface from '../webInterface';
import logUtil from '../log';

/**
 * start proxy server as well as recorder and webInterface
 */
class ProxyServer extends ProxyCore {
  public proxyWebinterfaceConfig: any;
  /**
   *
   * @param {object} config - config
   * @param {object} [config.webInterface] - config of the web interface
   * @param {boolean} [config.webInterface.enable=false] - if web interface is enabled
   * @param {number} [config.webInterface.webPort=8002] - http port of the web interface
   */
  constructor(config: AnyProxyConfig) {
    // prepare a recorder
    const recorder = new Recorder();
    const configForCore = Object.assign({
      recorder,
    }, config);

    super(configForCore);

    this.proxyWebinterfaceConfig = config.webInterface;
    this.recorder = recorder;
    this.webServerInstance = null;
  }

  public start(): ProxyServer {
    // start web interface if neeeded
    if (this.proxyWebinterfaceConfig && this.proxyWebinterfaceConfig.enable) {
      this.webServerInstance = new WebInterface(this.proxyWebinterfaceConfig, this.recorder);
      // start web server
      this.webServerInstance.start().then(() => {
        // start proxy core
        super.start();
      })
      .catch((e) => {
        this.emit('error', e);
      });
    } else {
      super.start();
    }
    return this;
  }

  public close(): Promise<Error> {
    return new Promise((resolve, reject) => {
      super.close()
        .then((error) => {
          if (error) {
            resolve(error);
          }
        });

      if (this.recorder) {
        logUtil.printLog('clearing cache file...');
        this.recorder.clear();
      }
      const tmpWebServer = this.webServerInstance;
      this.recorder = null;
      this.webServerInstance = null;
      if (tmpWebServer) {
        logUtil.printLog('closing webserver...');
        tmpWebServer.close((error) => {
          if (error) {
            console.error(error);
            logUtil.printLog(`proxy web server close FAILED: ${error.message}`, logUtil.T_ERR);
          } else {
            logUtil.printLog(`proxy web server closed at ${this.proxyHostName} : ${this.proxyWebinterfaceConfig.webPort}`);
          }

          resolve(error);
        });
      } else {
        resolve(null);
      }
    });
  }
}

export default ProxyServer;
