/*
* Test suites for WebSocket.
* ONLY TO ENSURE THE REQUEST WILL BE BYPASSED SUCCESSFULLY, WE HAVEN'T SUPPORTTED WEBSOCKET YET.
*
*/
const ProxyServerUtil = require('../util/ProxyServerUtil.js');
const { generateWsUrl, directWs, proxyWs } = require('../util/HttpUtil.js');
const Server = require('../server/server.js');
const { printLog, isArrayEqual, isCommonReqEqual } = require('../util/CommonUtil.js');

testWebsocket('ws');
testWebsocket('wss');
testWebsocket('ws', true);
testWebsocket('wss', true);

function testWebsocket(protocol, masked = false) {
  describe('Test WebSocket in protocol : ' + protocol, () => {
    const url = generateWsUrl(protocol, '/test/socket');
    let serverInstance;
    let proxyServer;
    // the message to
    const testMessageArray = [
      'Send the message with default option1',
      'Send the message with default option2',
      'Send the message with default option3',
      'Send the message with default option4'
    ];

    const websocketHeaders = {
      referer: 'https://www.anyproxy.io/websocket/test',
      origin: 'www.anyproxy.io'
    }

    beforeAll((done) => {
      jasmine.DEFAULT_TIMEOUT_INTERVAL = 200000;
      printLog('Start server for no_rule_websocket_spec');
      serverInstance = new Server();

      proxyServer = ProxyServerUtil.defaultProxyServer();

      setTimeout(() => {
        done();
      }, 2000);
    });

    afterAll(() => {
      serverInstance && serverInstance.close();
      proxyServer && proxyServer.close();
      printLog('Closed server for no_rule_websocket_spec');
    });

    it('Default websocket option', done => {
      const directMessages = []; // set the flag for direct message, compare when both direct and proxy got message
      const proxyMessages = [];
      let directResHeaders;
      let proxyResHeaders;

      const ws = directWs(url, websocketHeaders);
      const proxyWsRef = proxyWs(url, websocketHeaders);
      ws.on('open', () => {
        ws.send(testMessageArray[0], masked);
        for (let i = 1; i < testMessageArray.length; i++) {
          setTimeout(() => {
            ws.send(testMessageArray[i], masked);
          }, 1000);
        }
      });

      proxyWsRef.on('open', () => {
        try {
          proxyWsRef.send(testMessageArray[0], masked);
          for (let i = 1; i < testMessageArray.length; i++) {
            setTimeout(() => {
              proxyWsRef.send(testMessageArray[i], masked);
            }, 1000);
          }
        } catch (e) {
          console.error(e);
        }
      });

      ws.on('upgrade', (res) => {
        directResHeaders = res.headers;
        compareMessageIfReady();
      });

      proxyWsRef.on('upgrade', (res) => {
        proxyResHeaders = res.headers;
        compareMessageIfReady();
      });

      ws.on('message', (data, flag) => {
        const message = JSON.parse(data);
        if (message.type === 'onMessage') {
          directMessages.push(message.content);
          compareMessageIfReady();
        }
      });

      proxyWsRef.on('message', (data, flag) => {
        const message = JSON.parse(data);
        if (message.type === 'onMessage') {
          proxyMessages.push(message.content);
          compareMessageIfReady();
        }
      });

      ws.on('error', error => {
        console.error('error happened in direct websocket:', error);
        done.fail('Error happened in direct websocket');
      });

      proxyWsRef.on('error', error => {
        console.error('error happened in proxy websocket:', error);
        done.fail('Error happened in proxy websocket');
      });

      function compareMessageIfReady() {
        const targetLen = testMessageArray.length;
        if (directMessages.length === targetLen
          && proxyMessages.length === targetLen
          && directResHeaders && proxyResHeaders
        ) {
          expect(isArrayEqual(directMessages, testMessageArray)).toBe(true);
          expect(isArrayEqual(directMessages, proxyMessages)).toBe(true);
          expect(directResHeaders['x-anyproxy-websocket']).toBeUndefined();
          expect(proxyResHeaders['x-anyproxy-websocket']).toBe('true');
          expect(isCommonReqEqual(url, serverInstance)).toBe(true);
          done();
        }
      }
    });
  });
}
