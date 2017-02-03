const AnyProxy = require('../proxy');

const options = {
  type: 'http',
  port: 8001,
  rule: require('../test/test_rules/test_rule_replace_request_data.js'),
  webInterface: {
    enable: true,
    webPort: 8002,
    wsPort: 8003,
  },
  throttle: 10000,
  forceProxyHttps: true,
  silent: false
};
const proxyServer = new AnyProxy.ProxyServer(options);

proxyServer.on('ready', () => {
    // set as system proxy
  AnyProxy.utils.systemProxyMgr.enableGlobalProxy('127.0.0.1', '8001');    
});

proxyServer.on('error', (e) => {
  console.log('proxy error');
  console.log(e);
});

process.on('SIGINT', () => {
  AnyProxy.utils.systemProxyMgr.disableGlobalProxy();        
  proxyServer.close();
  process.exit();
});


proxyServer.start();
