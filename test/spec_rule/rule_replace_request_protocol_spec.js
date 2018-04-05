/*
* test for rule replaceOption rule
*
*/

const ProxyServerUtil = require('../util/ProxyServerUtil.js');
const { proxyGet, generateUrl, directGet } = require('../util/HttpUtil.js');
const Server = require('../server/server.js');
const { printLog } = require('../util/CommonUtil.js');

const rule = require('./rule/rule_replace_request_protocol.js');

testWrapper();

function testWrapper() {
  describe('Rule replaceRequestProtocol should be working', () => {
    let proxyServer;
    let serverInstance;

    beforeAll((done) => {
      jasmine.DEFAULT_TIMEOUT_INTERVAL = 50000;
      printLog('Start server for rule_replace_request_protocol');

      serverInstance = new Server();

      proxyServer = ProxyServerUtil.proxyServerWithRule(rule);

      setTimeout(() => {
        done();
      }, 2000);
    });

    afterAll(() => {
      serverInstance && serverInstance.close();
      proxyServer && proxyServer.close();
      printLog('Close server for rule_replace_request_protocol');
    });

    it('Should replace request protocol in PROXY https request', done => {
      const url = generateUrl('https', '/test/normal_request1');
      const httpUrl = url.replace('https', 'http');
      const token = 'proxy_request1_token_' + Date.now();
      proxyGet(url, {}, { token })
        .then(proxyRes => {
          expect(proxyRes.body).toEqual('body_normal_request1');

          // there should be no https url be requested in proxy, it should be http request
          expect(serverInstance.getProxyRequestRecord(url)).toBe(null);
          const httpRecord = serverInstance.getProxyRequestRecord(httpUrl);
          expect(httpRecord.headers.token).toEqual(token);
          expect(httpRecord.headers['via-proxy']).toEqual('true');
          done();
        })
        .catch(error => {
          console.error('Error happened in proxy the https request: ', error);
          done.fail('error happened in proxy the https request');
        });
    });

    it('Should not replace protocol in PROXY http request', done => {
      const url = generateUrl('http', '/test/normal_request2');
      const token = 'proxy_request2_token_' + Date.now();
      proxyGet(url, {}, { token })
        .then(proxyRes => {
          expect(proxyRes.body).toEqual('body_normal_request2');
          const requestRecord = serverInstance.getProxyRequestRecord(url);
          expect(requestRecord).not.toBe(null);
          expect(requestRecord.headers.token).toEqual(token);
          expect(requestRecord.headers['via-proxy']).toEqual('true');
          done();
        })
        .catch(error => {
          console.error('error happened in proxy the http request: ', error);
          done.fail('error happend in proxy the http request');
        });
    });

    it('Should the direct request still be working with https', done => {
      const url = generateUrl('https', '/test/normal_request1');
      const token = 'direct_request1_token_' + Date.now();
      directGet(url, {}, { token })
        .then(directRes => {
          expect(directRes.body).toEqual('body_normal_request1');
          const requestRecord = serverInstance.getRequestRecord(url);
          expect(requestRecord.headers.token).toEqual(token);
          expect(requestRecord.headers['via-proxy']).toBeUndefined();
          done();
        })
        .catch(error => {
          console.error('error happened in direct https get:', error);
          done.fail('error happened in direct https get');
        });
    });

    it('Should the direct request still be working with http', done => {
      const url = generateUrl('http', '/test/normal_request2');
      const token = 'direct_request1_token_' + Date.now();
      directGet(url, {}, { token })
        .then(directRes => {
          expect(directRes.body).toEqual('body_normal_request2');
          const requestRecord = serverInstance.getRequestRecord(url);
          expect(requestRecord.headers.token).toEqual(token);
          expect(requestRecord.headers['via-proxy']).toBeUndefined();
          done();
        })
        .catch(error => {
          console.error('error happened in direct http get:', error);
          done.fail('error happened in direct http get');
        });
    });
  });
}
