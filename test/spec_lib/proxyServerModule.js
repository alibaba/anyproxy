/*
* test for rule replaceOption rule
*
*/
const AnyProxy = require('../../proxy');
const {
  proxyGet,
  directGet,
  generateUrl,
} = require('../util/HttpUtil.js');
const Server = require('../server/server.js');

describe('AnyProxy.proxyServer basic test', () => {
  it('should successfully start a proxy server', done => {
    const options = {
      port: 8001,
      rule: null,
      webInterface: {
        enable: true,
        webPort: 8002
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
  let serverInstance;
  beforeAll(done => {
    // jasmine.DEFAULT_TIMEOUT_INTERVAL = 5000;
    serverInstance = new Server();

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
    serverInstance && serverInstance.close();
  });

  it('should work as expected for domain host', done => {
    // test if proxy server works
    proxyGet('https://www.tmall.com', {}, {})
      .then(res => {
        expect(res && res.statusCode && res.statusCode === 200 && res.body.length > 300).toBe(true);
        done();
      })
      .catch(done);
  });

  it('should work as expected for ip host', done => {
    // test if proxy server works
    proxyGet(generateUrl('https', '/test'), {}, {})
      .then(res => {
        expect(res && res.statusCode && res.statusCode === 200).toBe(true);
        done();
      })
      .catch(done);
  });

  it('should start webinterface correctly', done => {
    // test web interface
    directGet('http://127.0.0.1:8002', {}, {})
      .then(res => {
        expect(res && res.statusCode && res.statusCode === 200 && res.body.length > 300).toBe(true);
        done();
      })
      .catch(done);
  });

  it('should deal well with the gzip encoding response', done => {
    proxyGet(generateUrl('https', '/test/gzip'), {}, {})
      .then(res => {
        expect(res && res.statusCode === 200).toBe(true);
        expect(JSON.parse(res.body).type).toBe('gzip');
        done();
      })
      .catch(done);
  });

  it('should deal well with the deflate encoding response', done => {
    proxyGet(generateUrl('https', '/test/deflate'), {}, {})
      .then(res => {
        expect(res && res.statusCode === 200).toBe(true);
        expect(JSON.parse(res.body).type).toBe('deflate');
        done();
      })
      .catch(done);
  });

  it('should deal well with the brotli encoding response', done => {
    proxyGet(generateUrl('https', '/test/brotli'), {}, {})
      .then(res => {
        expect(res && res.statusCode === 200).toBe(true);
        expect(JSON.parse(res.body).type).toBe('brotli');
        done();
      })
      .catch(done);
  });
});
