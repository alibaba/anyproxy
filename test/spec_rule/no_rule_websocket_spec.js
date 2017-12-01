/*
* Test suites for WebSocket.
* ONLY TO ENSURE THE REQUEST WILL BE BYPASSED SUCCESSFULLY, WE HAVEN'T SUPPORTTED WEBSOCKET YET.
*
*/
const ProxyServerUtil = require('../util/ProxyServerUtil.js');
const { generateWsUrl, directWs, proxyWs } = require('../util/HttpUtil.js');
const Server = require('../server/server.js');
const { printLog } = require('../util/CommonUtil.js');

testWebsocket('ws');
testWebsocket('wss');

function testWebsocket(protocol) {
  describe('Test WebSocket in protocol : ' + protocol, () => {
    const url = generateWsUrl(protocol, '/test/socket');
    let serverInstance;
    let proxyServer;

    beforeAll((done) => {
      jasmine.DEFAULT_TIMEOUT_INTERVAL = 200000;
      printLog('Start server for no_rule_websocket_spec');
      serverInstance = new Server();

      proxyServer = ProxyServerUtil.proxyServerWithoutHttpsIntercept();

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
      const sendMessage = 'Send the message with default option';
      let directMessage; // set the flag for direct message, compare when both direct and proxy got message
      let proxyMessage;

      const ws = directWs(url);
      const porxyWsRef = proxyWs(url);
      ws.on('open', () => {
        ws.send(sendMessage);
      });

      porxyWsRef.on('open', () => {
        porxyWsRef.send(sendMessage);
      });

      ws.on('message', (data, flag) => {
        const message = JSON.parse(data);
        if (message.type === 'onMessage') {
          directMessage = message.content;
          compareMessageIfReady();
        }
      });

      porxyWsRef.on('message', (data, flag) => {
        const message = JSON.parse(data);
        if (message.type === 'onMessage') {
          proxyMessage = message.content;
          compareMessageIfReady();
        }
      });

      ws.on('error', error => {
        console.error('error happened in direct websocket:', error);
        done.fail('Error happened in direct websocket');
      });

      porxyWsRef.on('error', error => {
        console.error('error happened in proxy websocket:', error);
        done.fail('Error happened in proxy websocket');
      });

      function compareMessageIfReady() {
        if (directMessage && proxyMessage) {
          expect(directMessage).toEqual(proxyMessage);
          expect(directMessage).toEqual(sendMessage);
          done();
        }
      }
    });

    it('masked:true', done => {
      const sendMessage = 'Send the message with option masked:true';
      let directMessage; // set the flag for direct message, compare when both direct and proxy got message
      let proxyMessage;

      const ws = directWs(url);
      const porxyWsRef = proxyWs(url);
      ws.on('open', () => {
        ws.send(sendMessage, { masked: true });
      });

      porxyWsRef.on('open', () => {
        porxyWsRef.send(sendMessage, { masked: true });
      });

      ws.on('message', (data, flag) => {
        const message = JSON.parse(data);
        if (message.type === 'onMessage') {
          directMessage = message.content;
          compareMessageIfReady();
        }
      });

      porxyWsRef.on('message', (data, flag) => {
        const message = JSON.parse(data);
        if (message.type === 'onMessage') {
          proxyMessage = message.content;
          compareMessageIfReady();
        }
      });

      ws.on('error', error => {
        console.error('error happened in direct websocket:', error);
        done.fail('Error happened in direct websocket');
      });

      porxyWsRef.on('error', error => {
        console.error('error happened in proxy websocket:', error);

        done.fail('Error happened in proxy websocket');
      });

      function compareMessageIfReady() {
        if (directMessage && proxyMessage) {
          expect(directMessage).toEqual(proxyMessage);
          expect(directMessage).toEqual(sendMessage);
          done();
        }
      }
    });
  });
}

