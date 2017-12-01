//rule scheme : replace the reponse data

module.exports = {

  *beforeSendResponse(requestDetail, responseDetail) {
    if (requestDetail.url.indexOf('/test/normal_request1') > -1) {
      const newResponse = responseDetail.response;

      const newDataStr = newResponse.body.toString() + '_hello_world!';
      newResponse.body = newDataStr;

      return {
        response: newResponse
      };
    }
  }
};
