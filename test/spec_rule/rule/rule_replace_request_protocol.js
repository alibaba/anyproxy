//rule scheme :
module.exports = {
  *summary() {
    return 'The rule to replace request protocol';
  },

  *beforeSendRequest(requestDetail) {
    const newConfig = {
      protocol: 'http',
      requestOptions: requestDetail.requestOptions
    };
    newConfig.requestOptions.port = 3000;
    return newConfig;
  }
};
