const proxy = require('../proxy.js'),
  proxyTester = require('proxy-eval'),
  WebSocket = require('ws');

//start a new proxy at port 8995, with websocket port 8996
const SOCKET_PORT = 8996,
  PROXY_PORT = 8995;

new proxy.proxyServer({
  type: 'http',
  port: PROXY_PORT,
  socketPort: SOCKET_PORT,
  silent: true
});


exports.avalibility = function (test) {
  test.expect(2);
  let updateCount = 0;

  //test web socket
  setTimeout(() => {
    const ws = new WebSocket('ws://127.0.0.1:' + SOCKET_PORT, {
      protocolVersion: 8
    });
   
    ws.on('open', () => {});
    ws.on('close', () => {});
    ws.on('message', (data, flags) => {
      try {
        const jsonData = JSON.parse(data);
        jsonData.type === 'update' && ++updateCount;
      } catch (e) {}
    });

    setTimeout(() => {
      test.ok(updateCount >= 4, "web socket message count of type 'update' ");
      test.done();
      setTimeout(() => {
        process.exit();
      }, 1000);
    }, 10 * 1000);
  }, 1000);

  //test the basic availibility of proxy server
  setTimeout(() => {
    proxyTester.test({ proxy: 'http://127.0.0.1:8995', reqTimeout: 4500 }, (results) => {
      let successCount = 0;
      results.map((item) => {
        item.success && ++successCount;
      });

      const ifPassed = (true || results.length === successCount);
      if (!ifPassed) {
        proxyTester.printResult(results);
      }
      test.ok(ifPassed, 'availibility test failed');
    });
  }, 1000);
};
