/*
* Utility class for creating proxy server, used to create specfied proxy server
*
*/

let proxy = require('../../proxy.js');
const util = require('../../lib/util.js');

const DEFAULT_OPTIONS = {
    type: "http",
    port: 8001,
    hostname: "localhost",
    dbFile: null,  // optional, save request data to a specified file, will use in-memory db if not specified
    webPort: 8002,  // optional, port for web interface
    socketPort: 8003,  // optional, internal port for web socket, replace this when it is conflict with your own service
    throttle: 10000,    // optional, speed limit in kb/s
    disableWebInterface: false, //optional, set it when you don't want to use the web interface
    setAsGlobalProxy: false, //set anyproxy as your system proxy
    interceptHttps: true, // intercept https as well
    silent: false //optional, do not print anything into terminal. do not set it when you are still debugging.
};

/**
*
* @return An instance of proxy, could be closed by calling `instance.close()`
*/
function defaultProxyServer () {
    proxy = util.freshRequire('../proxy.js');

    const options = util.merge({}, DEFAULT_OPTIONS);
    options.rule = util.freshRequire('./rule_default.js');
    return new proxy.proxyServer(options);
}

/*
* Create proxy server with rule
* @param rules
    Object, the rule object which contains required intercept method
  @return An instance of proxy, could be closed by calling `instance.close()`
*/
function proxyServerWithRule (rule) {
    proxy = util.freshRequire('../proxy.js');

    const options = util.merge({}, DEFAULT_OPTIONS);
    options.rule = rule;

    return new proxy.proxyServer(options);
}

function proxyServerWithoutHttpsIntercept (rule) {
    proxy = util.freshRequire('../proxy.js');

    const options = util.merge({}, DEFAULT_OPTIONS);
    if (rule) {
        options.rule = rule;
    }
    options.interceptHttps = false;
    return new proxy.proxyServer(options);
}

module.exports = {
    defaultProxyServer,
    proxyServerWithoutHttpsIntercept,
    proxyServerWithRule
};