/*
* Rule defination for shouldUseLocalResponse
*
*/
const localData = 'handled_in_local_response';

module.exports = {
  *beforeSendRequest(requestDetail) {
    if (requestDetail.url.indexOf('uselocal') > -1) {
      return {
        response: {
          statusCode: 200,
          header: {
            'Via-Proxy-Local': 'true'
          },
          body: localData
        }
      };
    }
  }
};
