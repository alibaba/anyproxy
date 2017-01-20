/*
* Rule defination for shouldUseLocalResponse
*
*/
const Q = require('q');
const dealLocalBody = 'handled_in_local_response';

module.exports = {
    shouldUseLocalResponse: function (req, reqBody) {
        const d = Q.defer();
        d.resolve(req.url.indexOf('uselocal') > -1);
        return d.promise;
    },
    dealLocalResponse: function (req, reqBody, callback) {

        console.info('=============deal with local response');
        const header = {
            'Via-Proxy-Local': 'true'
        };

        const d = Q.defer();

        d.resolve({
            code: 200,
            header: header,
            body: dealLocalBody
        });

        return d.promise;
    }
};
