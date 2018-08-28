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
      console.info(requestDetail._req.connection._peername);
      const newRequestOptions = requestDetail.requestOptions;
      requestDetail.protocol = 'https';
      newRequestOptions.hostname = '127.0.0.1'
      newRequestOptions.port = '3001';
      newRequestOptions.path = '/test';
      newRequestOptions.method = 'GET';
      return requestDetail;
    }

    if (requestDetail.url.indexOf('http://mobilegw.stable.alipay.net/mgw.htm') === 0) {
      console.info(requestDetail.requestData.toString())
    }
  },
  *beforeDealHttpsRequest(requestDetail) {
    return true;
  }
};
