//rule scheme :

module.exports = {
  *summary() {
    return 'Rule to intercept https request';
  },

  *beforeSendResponse(requestDetail, responseDetail) {
    const newResponse = responseDetail.response;
    newResponse.body = newResponse.body.toString() + '_hello_world';
    return {
      response: newResponse
    };
  },

  *beforeDealHttpsRequest(requestDetail) {
    return requestDetail.host.indexOf('localhost:3001') > -1;
  }
};
