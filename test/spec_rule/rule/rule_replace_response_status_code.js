//replace all the images with local one
module.exports = {

  *summary() {
    return 'replace the response status code.';
  },

  *beforeSendResponse(requestDetail, responseDetail) {
    if (requestDetail.url.indexOf('/test/normal_request1') >= 0) {
      const newResponse = responseDetail.response;
      newResponse.statusCode = 302;
      newResponse.header.location = 'www.taobao.com';

      return {
        response: newResponse
      };
    }
  },
};

