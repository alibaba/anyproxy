/* 
  sample: 
    modify the post data towards http://httpbin.org/post
  start proyx:
    anyproxy --rule sample_modify_request_data.js
  test:
    curl http://httpbin.org/ --proxy http://127.0.0.1:8001
  expected response:
    { "data": "i-am-anyproxy-modified-post-data" }

*/
module.exports = {
  *beforeSendRequest(requestDetail) {
    if (requestDetail.url.indexOf('http://httpbin.org') === 0) {
      const newRequestOptions = requestDetail.requestOptions;
      newRequestOptions.headers['User-Agent'] = 'AnyProxy/0.0.0';
      return {
        requestOptions: newRequestOptions
      };
    }
  },
};
