/*
* test for rule replaceOption rule
*
*/

const AnyProxy = require('../../proxy');
const { proxyGet, directGet } = require('../util/HttpUtil.js');

describe('AnyProxy.proxyServer basic test', () => {
  it('should successfully start a proxy server', done => {
    const options = {
      port: 8001,
      rule: null,
      webInterface: {
        enable: true,
        webPort: 8002,
        wsPort: 8003,
      },
      throttle: 10000,
      forceProxyHttps: false,
      silent: false
    };
    const proxyServer = new AnyProxy.ProxyServer(options);
    proxyServer.on('ready', () => {
      proxyServer.close();
      done();
    });
    proxyServer.on('error', done.fail);
    proxyServer.start();
  });
});

describe('AnyProxy.proxyServer high order test', () => {
  let proxyServer;
  beforeAll(done => {
    const options = {
      port: 8001,
      rule: null,
      webInterface: {
        enable: true,
        webPort: 8002,
      },
      throttle: 10000,
      forceProxyHttps: false,
      silent: false
    };
    proxyServer = new AnyProxy.ProxyServer(options);
    proxyServer.on('ready', done);
    proxyServer.start();
  });

  afterAll(() => {
    proxyServer && proxyServer.close();
  });

  it('should work as expected', done => {
    // test if proxy server works
    proxyGet('http://www.qq.com', {}, {})
      .then(res => {
        expect(res && res.statusCode && res.statusCode === 200 && res.body.length > 300).toBe(true);
        done();
      })
      .catch(done.fail)
  });

  it('should start webinterface correctly', done => {
    // test web interface
    directGet('http://127.0.0.1:8002', {}, {})
      .then(res => {
        expect(res && res.statusCode && res.statusCode === 200 && res.body.length > 300).toBe(true);
        done();        
      })
      .catch(done.fail)
  });
});
