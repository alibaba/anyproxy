const { basicProxyRequest, proxyServerWithRule, } = require('../util.js');

const RULE_REPLACE_HEADER_KEY = 'rule_replace_header_key';
const RULE_REPLACE_HEADER_VALUE = 'rule_replace_header_value';
const RULE_REPLACE_BODY = 'RULE_REPLACE_BODY';
const rule = {
  *beforeSendResponse(requestDetail, responseDetail) {
    if (requestDetail.url.indexOf('/uuid') >= 0) {
      const newResponse = responseDetail.response;
      newResponse.header[RULE_REPLACE_HEADER_KEY] = RULE_REPLACE_HEADER_VALUE;
      newResponse.body = RULE_REPLACE_BODY;
      newResponse.statusCode = 502;
      return {
        response: newResponse,
      };
    }
  },
};

describe('Rule replaceResponseData', () => {
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

  it('Should replace the header and body', async () => {
    const url = 'http://httpbin.org/uuid';
    await basicProxyRequest(proxyHost, 'GET', url).then((result) => {
      const proxyRes = result.response;
      const body = result.body;
      expect(proxyRes.statusCode).toBe(502);
      expect(proxyRes.headers[RULE_REPLACE_HEADER_KEY]).toBe(RULE_REPLACE_HEADER_VALUE);
      expect(body).toBe(RULE_REPLACE_BODY);
    });
  });
});
