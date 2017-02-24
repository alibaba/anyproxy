/* 
  sample: 
    modify all status code of http://httpbin.org/ to 404
  test:
    curl -I 'http://httpbin.org/user-agent' --proxy http://127.0.0.1:8001
  expected response:
    HTTP/1.1 404 Not Found
*/
module.exports = {
  *beforeSendResponse(requestDetail, responseDetail) {
    if (requestDetail.url.indexOf('http://httpbin.org') === 0) {
      const newResponse = responseDetail.response;
      newResponse.statusCode = 404;
      return {
        response: newResponse
      };
    }
  }
};
