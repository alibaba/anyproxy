/*
* add authToken parameter to the request data
*
*/
module.exports = {
  *beforeSendRequest(requestDetail) {
    if (requestDetail.url.indexOf('/getuser') >= 0) {
      let requestStr = requestDetail.requestData.toString();
      try {
        requestStr = JSON.stringify(Object.assign(JSON.parse(requestStr), {
          authToken: 'auth_token_inrule'
        }))
      } catch (e) {
        requestStr += '&authToken=auth_token_inrule';
      }
      return {
        requestOptions: requestDetail.requestOptions,
        requestData: requestStr
      };
    }
  }
};
