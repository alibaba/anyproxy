/* 
  sample: 
    redirect all http requests of httpbin.org to https
  test:
    curl 'http://httpbin.org/get?show_env=1' --proxy http://127.0.0.1:8001
  expected response:
    { "X-Forwarded-Protocol": "https" }
*/
module.exports = {
  *beforeSendRequest(requestDetail) {
    if (requestDetail.url.indexOf('http://httpbin.org') === 0) {
      const newOption = requestDetail.requestOptions;
      newOption.port = 443;
      return {
        protocol: 'https',
        requestOptions: newOption
      };
    }
  }
};
