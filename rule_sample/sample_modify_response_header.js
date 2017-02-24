/* 
  sample: 
    modify response header of http://httpbin.org/user-agent
  test:
    curl -I 'http://httpbin.org/user-agent' --proxy http://127.0.0.1:8001
  expected response:
    X-Proxy-By: AnyProxy
*/
module.exports = {
  *beforeSendResponse(requestDetail, responseDetail) {
    if (requestDetail.url.indexOf('http://httpbin.org/user-agent') === 0) {
      const newResponse = responseDetail.response;
      newResponse.header['X-Proxy-By'] = 'AnyProxy';
      return {
        response: newResponse
      };
    }
  }
};
