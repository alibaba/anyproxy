/*
* test for rule shouldInterceptHttpsReq rule
*
*/
const ProxyServerUtil = require('../util/ProxyServerUtil.js');
const { proxyGet, directGet } = require('../util/HttpUtil.js');
const Server = require('../server/server.js');
const { printLog } = require('../util/CommonUtil.js');

const rule = require('./rule/rule_should_intercept_https_req.js');

testWrapper();

function testWrapper() {
  describe('Rule shouldInterceptHttpsReq should be working', () => {
    let proxyServer;
    let serverInstance;

    beforeAll(done => {
      jasmine.DEFAULT_TIMEOUT_INTERVAL = 50000;
      printLog('Start server for test_rule_should_intercept_https_req_spec');

      serverInstance = new Server();

      proxyServer = ProxyServerUtil.proxyServerWithRule(rule, {
        forceProxyHttps: false
      });

      setTimeout(() => {
        done();
      }, 2000);
    });

    afterAll(() => {
      serverInstance && serverInstance.close();
      proxyServer && proxyServer.close();
      printLog('Close server for test_rule_should_intercept_https_req_spec');
    });

    it('Should replace the header in proxy if assertion is true', done => {
      const url = 'https://localhost:3001/test';

      proxyGet(url)
        .then(proxyRes => {
          directGet(url)
            .then(directRes => {
              expect(proxyRes.statusCode).toEqual(200);

              expect(directRes.statusCode).toEqual(200);
              expect(directRes.body + '_hello_world').toEqual(proxyRes.body);
              done();
            })
            .catch(error => {
              console.error('error happened in direct get: ', error);
              done.fail('error happened in direct get');
            });
        })
        .catch(error => {
          console.error('error happened in proxy get: ', error);
          done.fail('error happened in proxy get');
        });
    });

    it('Should not replace the header in proxy if assertion is false', done => {
      const url = 'https://localhost:3002/test';
      proxyGet(url)
        .then(proxyRes => {
          expect(proxyRes.statusCode).toEqual(200);

          directGet(url)
            .then(directRes => {
              expect(directRes.statusCode).toEqual(200);
              expect(directRes.body.replace(/\s/g, '')).toEqual(proxyRes.body.replace(/\s/g, ''));
              done();
            })
            .catch(error => {
              console.error('error happened in direct get: ', error);
              done.fail('error happened in direct get');
            });
        })
        .catch(error => {
          console.error('error happened in proxy get: ', error);
          done.fail('error happened in proxy get');
        });
    });
  });
}
