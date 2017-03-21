/*
* test for rule replaceResponseStatus rule
*
*/
const ProxyServerUtil = require('../util/ProxyServerUtil.js');
const { proxyGet } = require('../util/HttpUtil.js');

const { printLog } = require('../util/CommonUtil.js');

let errorInRule = null;
const ruleNotDealError = {
  *onError(requestDetail, error) {
    errorInRule = error;
  }
};

let errorInConnect = null;
const ruleDealConnectError = {
  *onConnectError(requestDetail, error) {
    errorInConnect = error;
  }
};

const ERROR_PAGE_IN_RULE = 'this is my error page';
const ruleReturnAnErrorPage = {
  *onError(requestDetail, error) {
    return {
      response: {
        statusCode: '200',
        header: {},
        body: ERROR_PAGE_IN_RULE,
      }
    };
  }
};

testWrapper('http');
testWrapper('https');
testHttpsConnect();

function testWrapper(protocol) {
  describe('Rule should get an error in :' + protocol, () => {
    let proxyServer;
    // let serverInstance;

    beforeAll((done) => {
      jasmine.DEFAULT_TIMEOUT_INTERVAL = 50000;
      printLog('Start server for rule_deal_error_spec');
      errorInRule = null;

      proxyServer = ProxyServerUtil.proxyServerWithRule(ruleNotDealError);

      setTimeout(() => {
        done();
      }, 2000);
    });

    afterAll(() => {
      // serverInstance && serverInstance.close();
      proxyServer && proxyServer.close();
      printLog('Close server for rule_deal_error_spec');
    });

    it('Should get a request error', done => {
      const url = protocol + '://not_exist_url.anyproxy.io';
      proxyGet(url)
        .then(proxyRes => {
          expect(proxyRes.statusCode).toEqual(500);
          expect(proxyRes.headers['proxy-error']).toEqual('true');
          expect(errorInRule).not.toBe(null);
          done();
        })
        .catch(error => {
          console.error('error happened in proxy get: ', error);
          done.fail('error happened in proxy get');
        });
    });
  });

  describe('Rule should return a custom error page in :' + protocol, () => {
    let proxyServer;
    // let serverInstance;

    beforeAll((done) => {
      jasmine.DEFAULT_TIMEOUT_INTERVAL = 50000;
      printLog('Start server for rule_deal_error_custom_error_page');

      proxyServer = ProxyServerUtil.proxyServerWithRule(ruleReturnAnErrorPage);

      setTimeout(() => {
        done();
      }, 2000);
    });

    afterAll(() => {
      // serverInstance && serverInstance.close();
      proxyServer && proxyServer.close();
      printLog('Close server for rule_deal_error_custom_error_page');
    });

    it('Should get a request error', done => {
      const url = protocol + '://not_exist_url.anyproxy.io';
      proxyGet(url)
        .then(proxyRes => {
          expect(proxyRes.statusCode).toEqual(200);
          expect(proxyRes.headers['proxy-error']).toBe(undefined);
          expect(proxyRes.body).toEqual(ERROR_PAGE_IN_RULE);
          done();
        })
        .catch(error => {
          console.error('error happened in proxy get: ', error);
          done.fail('error happened in proxy get');
        });
    });
  });
}

function testHttpsConnect() {
  describe('Rule should get a connect error', () => {
    let proxyServer;
    // let serverInstance;

    beforeAll((done) => {
      errorInConnect = null;
      jasmine.DEFAULT_TIMEOUT_INTERVAL = 50000;
      printLog('Start server for rule_deal_error_custom_error_page');

      proxyServer = ProxyServerUtil.proxyServerWithRule(ruleDealConnectError, {
        forceProxyHttps: false
      });

      setTimeout(() => {
        done();
      }, 2000);
    });

    afterAll(() => {
      proxyServer && proxyServer.close();
      printLog('Close server for rule_deal_error_custom_error_page');
    });

    it('Should get a request error', done => {
      const url = 'https://not_exist_url.anyproxy.io';
      proxyGet(url)
        .then(proxyRes => {
          done.fail('should throw an error when requesting');
        })
        .catch(error => {
          expect(errorInConnect).not.toBe(null);
          done();
        });
    });
  });
}
