/* 
  sample: 
    modify the user-agent in requests toward httpbin.org
  start proyx:
    anyproxy --rule sample_modify_request_header.js
  test:
    curl http://httpbin.org/user-agent --proxy http://127.0.0.1:8001
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
