const fs = require('fs');
const path = require('path');
const { basicProxyRequest, proxyServerWithRule, } = require('../util.js');

const RULE_PAYLOAD = 'this is something in rule';

const rule = {
  *beforeSendRequest(requestDetail) {
    const requestOptions = requestDetail.requestOptions;
    return {
      requestOptions,
      requestData: RULE_PAYLOAD,
    };
  },

  *beforeDealHttpsRequest(requestDetail) {
    return requestDetail.host.indexOf('httpbin.org') >= 0;
  }
};

describe('Rule beforeDealHttpsRequest', () => {
  let proxyServer;
  let proxyPort;
  let proxyHost;

  beforeAll(async () => {
    proxyServer = await proxyServerWithRule(rule);
    proxyPort = proxyServer.proxyPort;
    proxyHost = `http://localhost:${proxyPort}`;
  });

  afterAll(() => {
    return proxyServer && proxyServer.close();
  });
  it('Should replace the https request body', async () => {
    const url = 'https://httpbin.org/put';
    const payloadStream = fs.createReadStream(path.resolve(__dirname, '../fixtures/image.png'));
    const postHeaders = {
      anyproxy_header: 'header_value',
    };
  
    await basicProxyRequest(proxyHost, 'PUT', url, postHeaders, {}, payloadStream).then((result) => {
      const proxyRes = result.response;
      const body = JSON.parse(result.body);
      expect(proxyRes.statusCode).toBe(200);
      expect(body.data).toEqual(RULE_PAYLOAD);
      expect(body.url.indexOf('/put')).toBeGreaterThan(0);
    });
  });
});
