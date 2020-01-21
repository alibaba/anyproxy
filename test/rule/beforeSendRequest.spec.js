const fs = require('fs');
const path = require('path');
const { basicProxyRequest, proxyServerWithRule, } = require('../util.js');

const RULE_PAYLOAD = 'this is something in rule';
const RULE_REPLACE_HEADER_KEY = 'rule_replace_header_key';
const RULE_REPLACE_HEADER_VALUE = 'rule_replace_header_value';

const rule = {
  *beforeSendRequest(requestDetail) {
    const reqUrl = requestDetail.url;
    if (reqUrl.indexOf('/post') >= 0) {
      const requestOptions = requestDetail.requestOptions;
      requestOptions.path = '/put';
      requestOptions.method = 'PUT';
      return {
        requestOptions,
        requestData: RULE_PAYLOAD,
      };
    } else if (reqUrl.indexOf('/status/302') >= 0) {
      return {
        response: {
          statusCode: 404,
          header: {
            [RULE_REPLACE_HEADER_KEY]: RULE_REPLACE_HEADER_VALUE,
            'content-type': 'plain/text',
          },
          body: RULE_PAYLOAD
        }
      };
    } else if (reqUrl.indexOf('/should_be_replaced') >= 0) {
      const requestOptions = requestDetail.requestOptions;
      requestOptions.hostname = 'httpbin.org';
      requestOptions.path = '/status/302';
      requestOptions.port = '443';
      return {
        protocol: 'https',
        requestOptions,
      };
    }
  }
};

describe('Rule replaceRequestData', () => {
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

  it('should replace the request data in proxy if the assertion is true', async () => {
    const url = 'http://httpbin.org/post';
    const payloadStream = fs.createReadStream(path.resolve(__dirname, '../fixtures/image.png'));
    const postHeaders = {
      anyproxy_header: 'header_value',
    };
  
    await basicProxyRequest(proxyHost, 'POST', url, postHeaders, {}, payloadStream).then((result) => {
      const proxyRes = result.response;
      const body = JSON.parse(result.body);
      expect(proxyRes.statusCode).toBe(200);
      expect(body.data).toEqual(RULE_PAYLOAD);
      expect(body.url.indexOf('/put')).toBeGreaterThan(0);
    });
  });

  it('should respond content specified in rule', async () => {
    const url = 'http://httpbin.org/status/302';  
    await basicProxyRequest(proxyHost, 'GET', url).then((result) => {
      const proxyRes = result.response;
      const body = result.body;
      expect(body).toBe(RULE_PAYLOAD);
      expect(proxyRes.statusCode).toBe(404);
      expect(proxyRes.headers[RULE_REPLACE_HEADER_KEY]).toBe(RULE_REPLACE_HEADER_VALUE);
    });
  });

  it('should replace protocol and url', async () => {
    const url = 'http://domain_not_exists.anyproxy.io/should_be_replaced';  
    await basicProxyRequest(proxyHost, 'GET', url).then((result) => {
      const proxyRes = result.response;
      expect(proxyRes.statusCode).toBe(302);
    });
  });
});
