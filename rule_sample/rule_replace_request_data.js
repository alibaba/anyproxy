/*
* add auth-token parameter to the request data
*
*/
const Buffer = require('buffer').Buffer;
const Q = require('q');

module.exports = {

    replaceRequestData: function(req, data){
        const d = Q.defer();
        if (req.path.indexOf('/authtoken.json') >= 0) {
            // the data is a Buffer object
            let requestStr = data.toString();
            const requestObj = JSON.parse(requestStr);
            if(!requestObj.authToken) {
                requestObj.authToken = 'authtoken_from_rule';
            }
            requestStr = JSON.stringify(requestObj);
            d.resolve(Buffer.from(requestStr));
        } else {
            d.resolve(data);
        }

        return d.promise;
    }
};
