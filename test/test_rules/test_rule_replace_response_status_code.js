//replace all the images with local one
const fs      = require("fs");
const Q = require('q');

module.exports = {

    summary:function(){
        return "replace the response status code.";
    },

    // redirect specified url with 302
    replaceResponseStatusCode: function(req,res, statusCode){
        const d = Q.defer();
        if(req.url.indexOf('/test/normal_request1') >= 0) {
            d.resolve(302);
        } else {
            d.resolve(statusCode);
        }
        return d.promise;
    },
    replaceResponseHeader: function (req, res, headers) {
        const d = Q.defer();
        headers = Object.assign({}, headers);

        if (req.url.indexOf('/test/normal_request1') >= 0) {
            headers.location="www.taobao.com";
        }
        d.resolve(headers);
        return d.promise;
    }
};

