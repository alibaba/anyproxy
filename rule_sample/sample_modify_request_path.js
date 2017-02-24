/* 
  sample: 
    redirect all httpbin.org requests to http://httpbin.org/user-agent
  test:
    curl http://httpbin.org/any-path --proxy http://127.0.0.1:8001
  expected response:
    { "user-agent": "curl/7.43.0" }
*/
module.exports = {
  *beforeSendRequest(requestDetail) {
    if (requestDetail.url.indexOf('http://httpbin.org') === 0) {
      const newRequestOptions = requestDetail.requestOptions;
      newRequestOptions.path = '/user-agent';
      newRequestOptions.method = 'GET';
      return {
        requestOptions: newRequestOptions
      };
    }
  },
};
