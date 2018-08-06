/**
* start the AnyProxy server
*/

const ruleLoader = require('../lib/ruleLoader');
const logUtil = require('../lib/log');
const AnyProxy = require('../proxy');

module.exports = function startServer(program) {
  let proxyServer;
  // load rule module
  new Promise((resolve, reject) => {
    if (program.rule) {
      resolve(ruleLoader.requireModule(program.rule));
    } else {
      resolve(null);
    }
  })
    .catch(e => {
      logUtil.printLog('Failed to load rule file', logUtil.T_ERR);
      logUtil.printLog(e, logUtil.T_ERR);
      process.exit();
    })

    //start proxy
    .then(ruleModule => {
      proxyServer = new AnyProxy.ProxyServer({
        type: 'http',
        port: program.port || 8001,
        throttle: program.throttle,
        rule: ruleModule,
        webInterface: {
          enable: true,
          webPort: program.web,
        },
        wsIntercept: program.wsIntercept,
        forceProxyHttps: program.intercept,
        dangerouslyIgnoreUnauthorized: !!program.ignoreUnauthorizedSsl,
        silent: program.silent
      });
      // proxyServer.on('ready', () => {});
      proxyServer.start();
    })
    .catch(e => {
      logUtil.printLog(e, logUtil.T_ERR);
      if (e && e.code) {
        logUtil.printLog('code ' + e.code, logUtil.T_ERR);
      }
      logUtil.printLog(e.stack, logUtil.T_ERR);
    });


  process.on('exit', (code) => {
    if (code > 0) {
      logUtil.printLog('AnyProxy is about to exit with code: ' + code, logUtil.T_ERR);
    }

    process.exit();
  });

  //exit cause ctrl+c
  process.on('SIGINT', () => {
    try {
      proxyServer && proxyServer.close();
    } catch (e) {
      console.error(e);
    }
    process.exit();
  });

  process.on('uncaughtException', (err) => {
    let errorTipText = 'got an uncaught exception, is there anything goes wrong in your rule file ?\n';
    try {
      if (err && err.stack) {
        errorTipText += err.stack;
      } else {
        errorTipText += err;
      }
    } catch (e) { }
    logUtil.printLog(errorTipText, logUtil.T_ERR);
    try {
      proxyServer && proxyServer.close();
    } catch (e) { }
    process.exit();
  });
}
