const { basicProxyRequest, proxyServerWithRule, } = require('../util.js');

const jestMockErrorFn = jest.fn();
const jestMockConnectErrorFn = jest.fn();

const ERROR_PAGE_IN_RULE = 'this is my error page';
const rule = {
  onConnectError: jestMockConnectErrorFn,
  *onError(requestDetail, error) {
    jestMockErrorFn(requestDetail, error);
    return {
      response: {
        statusCode: '200',
        header: {},
        body: ERROR_PAGE_IN_RULE,
      }
    };
  },
  *beforeDealHttpsRequest(requestDetail) {
    return requestDetail.host.indexOf('intercept') === 0;
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

  it('should get error', async () => {
    const url = 'https://intercept.anyproxy_not_exists.io/some_path';
    const result = await basicProxyRequest(proxyHost, 'GET', url);
    const proxyRes = result.response;
    const body = result.body;
    expect(proxyRes.statusCode).toBe(200);
    expect(body).toBe(ERROR_PAGE_IN_RULE);
    expect(jestMockErrorFn.mock.calls.length).toBe(1);
  });

  it('should get connec error', async () => {
    const url = 'https://anyproxy_not_exists.io/do_not_intercept';
    let e;
    try {
      await basicProxyRequest(proxyHost, 'GET', url);
    } catch (err) {
      e = err;
    }
    expect(e).not.toBeUndefined();
    expect(jestMockConnectErrorFn.mock.calls.length).toBe(1);
  });
});
