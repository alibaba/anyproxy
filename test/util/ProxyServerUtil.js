/*
* Utility class for creating proxy server, used to create specfied proxy server
*
*/

const util = require('../../lib/util.js');

const DEFAULT_OPTIONS = {
  type: 'http',
  port: 8001,
  webInterface: {
    enable: true,
    webPort: 8002,  // optional, port for web interface
    wsPort: 8003,  // optional, internal port for web socket
  },
  throttle: 10000,    // optional, speed limit in kb/s
  forceProxyHttps: true, // intercept https as well
  dangerouslyIgnoreUnauthorized: true,
  silent: false //optional, do not print anything into terminal. do not set it when you are still debugging.
};

/**
*
* @return An instance of proxy, could be closed by calling `instance.close()`
*/
function defaultProxyServer() {
  const AnyProxy = util.freshRequire('../proxy.js');

  const options = util.merge({}, DEFAULT_OPTIONS);
  const instance = new AnyProxy.ProxyServer(options);
  instance.on('error', e => {
    console.log('server instance error', e);
  });
  instance.start();
  return instance;
}

/*
* Create proxy server with rule
* @param rules
    Object, the rule object which contains required intercept method
  @return An instance of proxy, could be closed by calling `instance.close()`
*/
function proxyServerWithRule(rule, overrideConfig) {
  const AnyProxy = util.freshRequire('../proxy.js');

  const options = Object.assign({}, DEFAULT_OPTIONS, overrideConfig);
  options.rule = rule;

  const instance = new AnyProxy.ProxyServer(options);
  instance.on('error', e => {
    console.log('server instance error', e);
  });
  instance.start();

  return instance;
}

function proxyServerWithoutHttpsIntercept(rule) {
  const AnyProxy = util.freshRequire('../proxy.js');

  const options = util.merge({}, DEFAULT_OPTIONS);
  if (rule) {
    options.rule = rule;
  }
  options.forceProxyHttps = false;

  const instance = new AnyProxy.ProxyServer(options);
  instance.on('error', e => {
    console.log('server instance error', e);
  });
  instance.start();
  return instance;
}

module.exports = {
  defaultProxyServer,
  proxyServerWithoutHttpsIntercept,
  proxyServerWithRule
};
