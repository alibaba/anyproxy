/*
  sample:
    modify the post data towards http://httpbin.org/post
  test:
    curl -H "Content-Type: text/plain" -X POST -d 'original post data' http://httpbin.org/post --proxy http://127.0.0.1:8001
  expected response:
    { "data": "i-am-anyproxy-modified-post-data" }
*/
module.exports = {
  summary: 'Rule to modify request data',
  *beforeSendRequest(requestDetail) {
    if (requestDetail.url.indexOf('http://httpbin.org/post') === 0) {
      return {
        requestData: 'i-am-anyproxy-modified-post-data'
      };
    }
  },
};
