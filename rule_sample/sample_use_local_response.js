/* 
  sample: 
    intercept all requests toward httpbin.org, use a local response
  test:
    curl http://httpbin.org/user-agent --proxy http://127.0.0.1:8001
*/
module.exports = {
  *beforeSendRequest(requestDetail) {
    const localResponse = {
      statusCode: 200,
      header: { 'Content-Type': 'application/json' },
      body: '{"hello": "this is local response"}'
    };
    if (requestDetail.url.indexOf('http://httpbin.org') === 0) {
      return {
        response: localResponse
      };
    }
  },
};
