process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { printLog } = require('../util/CommonUtil.js');
const spawn = require('child_process').spawn;
const Server = require('../server/server.js');

const ProxyServerUtil = require('../util/ProxyServerUtil.js');

describe('Test request with big body', () => {
  let proxyServer;
  let serverInstance;

  beforeAll((done) => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 200000;
    printLog('Start server for no_rule_big_response');

    serverInstance = new Server();
    proxyServer = ProxyServerUtil.defaultProxyServer();
    
    setTimeout(() => {
      done();
    }, 2000);
  });

  afterAll(() => {
    serverInstance && serverInstance.close();
    proxyServer && proxyServer.close();
    printLog('Closed server for no_rule_spec');
  });

  it('should successfully get file', (done) => {
    const isWin = /^win/.test(process.platform);
    if (isWin) {
      done();
    } else {
      const curl = spawn('curl', ['http://localhost:3000/big_response', '--proxy', 'http://127.0.0.1:8001', '-o', '/dev/null']);
      curl.on('close', (code) => {
        expect(code).toEqual(0);
        done();
      });
    }
  });
});
