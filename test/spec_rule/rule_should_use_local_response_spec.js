/*
* test for rule shouldUseLocal
*
*/

const ProxyServerUtil = require('../util/ProxyServerUtil.js');
const { proxyGet, generateUrl } = require('../util/HttpUtil.js');
const Server = require('../server/server.js');
const { printLog } = require('../util/CommonUtil.js');

const rule = require('./rule/rule_should_use_local_response.js');

const expectedLocalBody = 'handled_in_local_response';

testWrapper('http');
testWrapper('https');

function testWrapper(protocol) {
  describe('Rule shouldUseLocalResponse should be working in :' + protocol, () => {
    let proxyServer;
    let serverInstance;

    beforeAll((done) => {
      jasmine.DEFAULT_TIMEOUT_INTERVAL = 50000;
      printLog('Start server for rule_shouldUseLocalResponse_spec');

      serverInstance = new Server();

      proxyServer = ProxyServerUtil.proxyServerWithRule(rule);

      setTimeout(() => {
        done();
      }, 2000);
    });

    afterAll(() => {
      serverInstance && serverInstance.close();
      proxyServer && proxyServer.close();
      printLog('Close server for rule_shouldUseLocalResponse_spec');
    });

    it('Should use local response if the assertion is true', done => {
      const url = generateUrl(protocol, '/test/uselocal');
      proxyGet(url, {})
        .then(res => {
          expect(res.body).toEqual(expectedLocalBody);
          expect(res.headers['via-proxy-local']).toEqual('true');
          done();
        }).catch((error) => {
          console.log('error happened in proxy get for shouldUseLocal: ', error);
          done.fail('error happened when test shouldUseLocal rule');
        });
    });
  });
}
