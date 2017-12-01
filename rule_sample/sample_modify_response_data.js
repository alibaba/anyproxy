/* 
  sample: 
    modify response data of http://httpbin.org/user-agent
  test:
    curl 'http://httpbin.org/user-agent' --proxy http://127.0.0.1:8001
  expected response:
    { "user-agent": "curl/7.43.0" } -- AnyProxy Hacked! --
*/

module.exports = {
  *beforeSendResponse(requestDetail, responseDetail) {
    if (requestDetail.url === 'http://httpbin.org/user-agent') {
      const newResponse = responseDetail.response;
      newResponse.body += '-- AnyProxy Hacked! --';
      return new Promise((resolve, reject) => {
        setTimeout(() => { // delay the response for 5s
          resolve({ response: newResponse });
        }, 5000);
      });
    }
  },
};
