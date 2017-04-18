//rule scheme : remove the cache headers in response headers
module.exports = {
  *summary() {
    return 'The rule to remove the cache headers in response';
  },

  *beforeSendResponse(requestDetail, responseDetail) {
    if (requestDetail.url.indexOf('/test/normal_request1') >= 0) {
      const newResponse = responseDetail.response;
      newResponse.header.replacedheaderkey = 'replacedHeader_value_in_rule';

      return {
        response: newResponse
      };
    }
  }

  // replaceResponseHeader(req, res, header) {
  //   const d = Q.defer();

  //   header = Object.assign({}, header);
  //   if (req.url.indexOf('test/normal_request1') > -1) {
  //     header.replacedheaderkey = 'replacedHeader_value_in_rule';
  //   }

  //   d.resolve(header);

  //   return d.promise;
  // }
};
