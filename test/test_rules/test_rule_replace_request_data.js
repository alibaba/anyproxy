/*
* add authToken parameter to the request data
*
*/
const Q = require('q');
const Buffer = require('buffer').Buffer;

module.exports = {

    replaceRequestData: function(req, data){
        const d = Q.defer();
        if (req.url.indexOf('/getuser') >= 0) {
            let requestStr = data.toString();
            requestStr += '&authToken=auth_token_inrule';
            d.resolve(Buffer.from(requestStr));
        } else {
            d.resolve(data);
        }

        return d.promise;
    }
};
