/*
* test for rule replaceRequestData rule
*
*/
const ProxyServerUtil = require('../util/ProxyServerUtil.js');
const { proxyPost, generateUrl, directPost, isViaProxy } = require('../util/HttpUtil.js');
const Server = require('../server/server.js');
const { printLog, isObjectEqual } = require('../util/CommonUtil.js');

const rule = require('./rule/rule_replace_request_data.js');

testWrapper('http');
testWrapper('https');

function testWrapper(protocol) {
  describe('Rule replaceRequestData should be working in :' + protocol, () => {
    let proxyServer;
    let serverInstance;

    beforeAll((done) => {
      jasmine.DEFAULT_TIMEOUT_INTERVAL = 50000;
      printLog('Start server for rule_replace_request_data_spec');

      serverInstance = new Server();
      proxyServer = ProxyServerUtil.proxyServerWithRule(rule);
      
      setTimeout(() => {
        done();
      }, 2000);
    });

    afterAll(() => {
      serverInstance && serverInstance.close();
      proxyServer && proxyServer.close();
      printLog('Close server for rule_replace_request_data_spec');
    });

    it('Should replace the request data in proxy if the assertion is true', done => {
      const url = generateUrl(protocol, '/test/getuser');
      const userName = 'username_test';
      const param = {
        username: userName
      };

      proxyPost(url, param)
        .then(proxyRes => {
          expect(proxyRes.statusCode).toEqual(200);
          expect(proxyRes.body).toEqual('body_post_getuser');
          const proxyRequest = serverInstance.getProxyRequestRecord(url);
          const proxyReqBodyObj = JSON.parse(proxyRequest.body.toString());

          expect(isViaProxy(proxyRequest)).toBe(true);

          expect(proxyReqBodyObj.username).toEqual(userName);
          expect(proxyReqBodyObj.authToken).toEqual('auth_token_inrule');
          
          directPost(url, param)
            .then(directRes => {
              expect(directRes.statusCode).toEqual(200);
              expect(directRes.body).toEqual(proxyRes.body);
              

              const directRequest = serverInstance.getRequestRecord(url);
              const directReqBodyObj = JSON.parse(directRequest.body.toString());
              expect(isViaProxy(directRequest)).toBe(false);
              
              expect(directReqBodyObj.username).toEqual(userName);
              expect(directReqBodyObj.authToken).toBeUndefined();
              done();
            })
            .catch(error => {
              console.error('error happened in direct post: ', error);
              done.fail('error happened in direct post');
            });
        })
        .catch(error => {
          console.error('error happened in proxy post: ', error);
          console.error(error);
          console.error(error.stack);
          done.fail('error happened in proxy post');
        });
    });

    it('Should not replace the request data in proxy if the assertion is false', done => {
      const url = generateUrl(protocol, '/test/normal_post_request1');
      const userName = 'normal_username_test';

      const param = {
        username: userName
      };

      proxyPost(url, param)
        .then(proxyRes => {
          expect(proxyRes.statusCode).toEqual(200);
          expect(proxyRes.body).toEqual('body_normal_post_request1');
          const proxyReqRecord = serverInstance.getProxyRequestRecord(url);
          const proxyReqBody = JSON.parse(proxyReqRecord.body);
          expect(isObjectEqual(proxyReqBody, param, url)).toBe(true);

          directPost(url, param)
            .then(directRes => {
              expect(directRes.statusCode).toEqual(proxyRes.statusCode);
              expect(directRes.body).toEqual(proxyRes.body);
              const directReqRecord = serverInstance.getRequestRecord(url);
              const directReqBody = JSON.parse(directReqRecord.body);
              expect(isObjectEqual(directReqBody, proxyReqBody, url)).toBe(true);
              done();
            })
            .catch(error => {
              console.error('error happened in direct post:', error);
              done.fail('error happened in direct post');
            });
        })
        .catch(error => {
          console.error('error happened in proxy post:', error);
          done.fail('error happened in proxy post');
        });
    });
  });
}
