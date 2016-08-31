/*
* Rule defination for shouldUseLocalResponse
*
*/

const dealLocalBody = 'handled_in_local_response';

module.exports = {
    shouldUseLocalResponse: function (req, reqBody) {
        return req.url.indexOf('uselocal') > -1;
    },
    shouldInterceptHttpsReq: function () {
        return true;
    },
    dealLocalResponse: function (req, reqBody, callback) {
        const header = {
            'Via-Proxy-Local': 'true'
        };

        callback(200, header, dealLocalBody);
    }
};
