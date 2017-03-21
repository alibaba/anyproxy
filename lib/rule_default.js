'use strict';

module.exports = {
  
  summary: 'the default rule for AnyProxy',
  
  /**
   * 
   * 
   * @param {object} requestDetail
   * @param {string} requestDetail.protocol
   * @param {object} requestDetail.requestOptions
   * @param {object} requestDetail.requestData
   * @param {object} requestDetail.response
   * @param {number} requestDetail.response.statusCode
   * @param {object} requestDetail.response.header
   * @param {buffer} requestDetail.response.body
   * @returns
   */
  *beforeSendRequest(requestDetail) {
    return null;
  },


  /**
   * 
   * 
   * @param {object} requestDetail
   * @param {object} responseDetail
   */
  *beforeSendResponse(requestDetail, responseDetail) {
    return null;
  },


  /**
   * 
   * 
   * @param {any} requestDetail 
   * @returns 
   */
  *beforeDealHttpsRequest(requestDetail) {
    return false;
  },

  /**
   * 
   * 
   * @param {any} requestDetail 
   * @param {any} error 
   * @returns 
   */
  *onError(requestDetail, error) {
    return null;
  },


  /**
   * 
   * 
   * @param {any} requestDetail 
   * @param {any} error 
   * @returns 
   */
  *onConnectError(requestDetail, error) {
    return null;
  },
};
