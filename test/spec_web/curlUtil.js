const { curlify } = require('../../web/src/common/curlUtil');

describe('Test the curlify function', () => {
  it('request with headers', () => {
    const requestDetail = {
      method: 'POST',
      url: 'https://localhost:3001/test',
      reqHeader: {
        'via-proxy': 'true',
      },
    };
    const result = 'curl \'https://localhost:3001/test\' -X POST -H \'via-proxy: true\'';
    expect(curlify(requestDetail)).toBe(result);
  });

  it('request with JSON body', () => {
    const requestDetail = {
      method: 'POST',
      url: 'https://localhost:3001/test',
      reqHeader: {
        'content-type': 'application/json; charset=utf-8',
      },
      reqBody: '{"action":1,"method":"test"}',
    };
    const result = `curl '${requestDetail.url}' -X POST -H 'content-type: application/json; charset=utf-8' -d '${requestDetail.reqBody}'`;
    expect(curlify(requestDetail)).toBe(result);
  });

  it('accpet gzip encoding with compressed flag', () => {
    const requestDetail = {
      method: 'GET',
      url: 'https://localhost:3001/test',
      reqHeader: {
        Host: 'localhost',
        'Accept-Encoding': 'gzip',
      },
    };
    const result = 'curl \'https://localhost:3001/test\' -H \'Host: localhost\' -H \'Accept-Encoding: gzip\' --compressed';
    expect(curlify(requestDetail)).toBe(result);
  });

  it('escape url character', () => {
    const requestDetail = {
      method: 'GET',
      url: 'https://localhost:3001/test?a[]=1',
    };
    const result = 'curl \'https://localhost:3001/test?a\\[\\]=1\'';
    expect(curlify(requestDetail)).toBe(result);
  });
});
