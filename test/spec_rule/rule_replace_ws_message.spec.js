const async = require('async');
const ProxyServerUtil = require('../util/ProxyServerUtil.js');
const TestServer = require('../server/server.js');
const { printLog } = require('../util/CommonUtil.js');
const { proxyWs, generateWsUrl } = require('../util/HttpUtil.js');
const rule = require('./rule/rule_replace_ws_message');

describe('Rule to replace the websocket message', () => {
  let testServer = null;
  let proxyServer = null;

  beforeAll((done) => {
    printLog('Start server for rule_replace_ws_message_spec');

    testServer = new TestServer();
    proxyServer = ProxyServerUtil.proxyServerWithRule(rule);

    setTimeout(done, 2000);
  });

  afterAll(() => {
    testServer && testServer.close();
    proxyServer && proxyServer.close();
    printLog('Close server for rule_replace_ws_message_spec');
  });

  it('should replace websocket message from server', (done) => {
    async.mapSeries([
      { scheme: 'ws', masked: false },
      { scheme: 'ws', masked: true },
      { scheme: 'wss', masked: false },
      { scheme: 'wss', masked: true },
    ], (unit, callback) => {
      const url = generateWsUrl(unit.scheme, '/test/socket');
      const wsClient = proxyWs(url);

      wsClient.on('open', () => {
        wsClient.send('test', unit.masked);
      });
  
      wsClient.on('message', (message) => {
        // test beforeSendWsMessageToServer
        const requestRecord = testServer.getProxyRequestRecord(url);
        expect(requestRecord.messages[0]).toBe('replaced by beforeSendWsMessageToServer');

        try {
          const result = JSON.parse(message);
          if (result.type === 'onMessage') {
            // test beforeSendWsMessageToClient
            expect(result.content).toBe('replaced by beforeSendWsMessageToClient');
            callback();
          }
        } catch (err) { /* ignore error */ }
      });
  
      wsClient.on('error', (err) => {
        printLog('Error happened in proxy websocket');
        callback(err);
      });
    }, (err) => {
      if (err) {
        done.fail(err);
      } else {
        done();
      }
    });
  });
});
