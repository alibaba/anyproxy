/*
* test for rule replaceResponseData rule
*
*/
const ProxyServerUtil = require('../util/ProxyServerUtil.js');
const { proxyGet, generateUrl, directGet } = require('../util/HttpUtil.js');
const Server = require('../server/server.js');
const { printLog } = require('../util/CommonUtil.js');

const rule = require('./rule/rule_replace_response_data.js');

testWrapper('http');
testWrapper('https');

function testWrapper(protocol) {
  describe('Rule replaceResponseData should be working in :' + protocol, () => {
    let proxyServer;
    let serverInstance;

    beforeAll((done) => {
      jasmine.DEFAULT_TIMEOUT_INTERVAL = 50000;
      printLog('Start server for rule_replace_response_data');

      serverInstance = new Server();

      proxyServer = ProxyServerUtil.proxyServerWithRule(rule);

      setTimeout(() => {
        done();
      }, 2000);
    });

    afterAll(() => {
      serverInstance && serverInstance.close();
      proxyServer && proxyServer.close();
      printLog('Close server for rule_replace_response_data');
    });

    it('Should replace the header in proxy if assertion is true', done => {
      const url = generateUrl(protocol, '/test/normal_request1');
      proxyGet(url)
        .then(proxyRes => {
          expect(proxyRes.statusCode).toEqual(200);
          expect(proxyRes.body).toEqual('body_normal_request1_hello_world!');

          directGet(url)
            .then(directRes => {
              expect(directRes.statusCode).toEqual(200);
              expect(directRes.body).toEqual('body_normal_request1');
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
      const url = generateUrl(protocol, '/test/normal_request2');
      proxyGet(url)
        .then(proxyRes => {
          expect(proxyRes.statusCode).toEqual(200);
          expect(proxyRes.body).toEqual('body_normal_request2');

          directGet(url)
            .then(directRes => {
              expect(directRes.statusCode).toEqual(200);
              expect(directRes.body).toEqual(proxyRes.body);
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
