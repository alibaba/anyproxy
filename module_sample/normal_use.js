const AnyProxy = require('../proxy');

const options = {
  type: 'http',
  port: 8001,
  rule: null,
  webInterface: {
    enable: true,
    webPort: 8002
  },
  throttle: 10000,
  forceProxyHttps: true,
  silent: false
};
const proxyServer = new AnyProxy.ProxyServer(options);

proxyServer.on('ready', () => {
  console.log('ready');
  // set as system proxy
  proxyServer.close().then(() => {
    const proxyServerB = new AnyProxy.ProxyServer(options);
    proxyServerB.start();
  });

  console.log('closed');
  // setTimeout(() => {

  // }, 2000);


  // AnyProxy.utils.systemProxyMgr.enableGlobalProxy('127.0.0.1', '8001');    
});

proxyServer.on('error', (e) => {
  console.log('proxy error');
  console.log(e);
});

process.on('SIGINT', () => {
  // AnyProxy.utils.systemProxyMgr.disableGlobalProxy();        
  proxyServer.close();
  process.exit();
});


proxyServer.start();


// const WebSocketServer = require('ws').Server;
// const wsServer = new WebSocketServer({ port: 8003 },function(){
//   console.log('ready');

//   try {
//     const serverB = new WebSocketServer({ port: 8003 }, function (e, result) {
//       console.log('---in B---');
//       console.log(e);
//       console.log(result);
//     });
//   } catch(e) {
//     console.log(e);
//     console.log('e');
//   }

//   // wsServer.close(function (e, result) {
//   //   console.log('in close');
//   //   console.log(e);
//   //   console.log(result);
//   // });
// });
