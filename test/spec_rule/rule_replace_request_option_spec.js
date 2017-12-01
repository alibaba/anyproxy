/*
* test for rule replaceOption rule
*
*/

const ProxyServerUtil = require('../util/ProxyServerUtil.js');
const { proxyGet, generateUrl, directGet } = require('../util/HttpUtil.js');
const Server = require('../server/server.js');
const { printLog } = require('../util/CommonUtil.js');

const rule = require('./rule/rule_replace_request_option.js');

testWrapper('http');
testWrapper('https');

function testWrapper(protocol) {
  describe('Rule replaceRequestOption should be working in :' + protocol, () => {
    let proxyServer;
    let serverInstance;

    beforeAll(done => {
      jasmine.DEFAULT_TIMEOUT_INTERVAL = 50000;
      printLog('Start server for rule_replace_request_option_spec');

      serverInstance = new Server();

      proxyServer = ProxyServerUtil.proxyServerWithRule(rule);

      setTimeout(() => {
        done();
      }, 2000);
    });

    afterAll(() => {
      serverInstance && serverInstance.close();
      proxyServer && proxyServer.close();
      printLog('Close server for rule_replace_request_option_spec');
    });

    it('Should replace request option if the assertion is true', done => {
      const url = generateUrl(protocol, '/test/should_replace_option');
      const replacedUrl = generateUrl(protocol, '/test/new_replace_option');

      const token = 'replacedOption' + Date.now();
      const directToken = 'notRepacedOption' + Date.now();
      proxyGet(url, {}, { token })
        .then(proxyRes => {
          directGet(url, {}, { token: directToken })
            .then(directRes => {
              expect(proxyRes.statusCode).toEqual(200);
              expect(proxyRes.body).toEqual('the_new_replaced_option_page_content');

              const proxyRequestObj = serverInstance.getProxyRequestRecord(replacedUrl);
              expect(proxyRequestObj.headers.token).toEqual(token);
              expect(proxyRequestObj.headers['via-proxy']).toEqual('true');

              expect(directRes.statusCode).toEqual(200);
              expect(directRes.body).toEqual('the_request_that_has_not_be_replaced');

              const directRequestObj = serverInstance.getRequestRecord(url);
              expect(directRequestObj.headers.token).toEqual(directToken);

              done();
            }).catch(error => {
              console.error('error happened in direct get for replaceOption rule: ', error);
              done.fail('error happened when direct test replaceOption rule ');
            });
        }).catch(error => {
          console.error('error happened in proxy get for replaceOption rule: ', error);
          done.fail('error happened when proxy test replaceOption rule ');
        });
    });

    it('Should not replace request option if the assertion is false', done => {
      const url = generateUrl(protocol, '/test/should_not_replace_option');

      proxyGet(url)
        .then(proxyRes => {
          done();
        }, error => {
          console.error('error happened in proxy get:', error);
          done.fail('error happened in proxy get');
        }).catch(error => {
          console.error('error happend in syntax:', error);
          done.fail('error happend in syntax');
        });
    });
  });
}
