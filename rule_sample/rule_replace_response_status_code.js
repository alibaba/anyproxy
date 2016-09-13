//rule scheme :
const Q = require('q');
module.exports = {
    summary: function () {
        return 'The rule to replace reponse status code';
    },

    replaceResponseStatusCode: function(req,res,statusCode){
        //redirect requests toward http://www.taobao.com/*
        //                      to http://www.etao.com
        //using 302
        const d = Q.defer();

        if(req.headers.host == "www.taobao.com"){
            d.resolve(302);
        } else {
            d.resolve(statusCode);
        }
        return d.promise;
    },

    replaceResponseHeader: function(req,res,headers){
        // in combination with 302, this is not required when replace statusCode
        const d = Q.defer();
        headers = Object.assign({}, headers);
        if(headers.host == "www.taobao.com"){
            headers.location = "http://www.etao.com";
        }
        d.resolve(headers);

        return d.promise;
    }
};