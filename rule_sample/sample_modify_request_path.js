/*
  sample:
    redirect all https://httpbin.org/user-agent requests to http://localhost:8008/index.html
  test:
    curl https://httpbin.org/user-agent --proxy http://127.0.0.1:8001
  expected response:
    'hello world' from 127.0.0.1:8001/index.html
*/
module.exports = {
  *beforeSendRequest(requestDetail) {
    if (requestDetail.url.indexOf('https://httpbin.org/user-agent') === 0) {
      const newRequestOptions = requestDetail.requestOptions;
      requestDetail.protocol = 'http';
      newRequestOptions.hostname = '127.0.0.1'
      newRequestOptions.port = '8008';
      newRequestOptions.path = '/index.html';
      newRequestOptions.method = 'GET';
      return requestDetail;
    }
  },
  *beforeDealHttpsRequest(requestDetail) {
    return true;
  }
};
