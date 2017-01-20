//rule scheme :
module.exports = {
    summary: function () {
        return 'The rule to replace reponse status code';
    },

    replaceResponseStatusCode: function(req,res,statusCode){
        //redirect requests toward http://www.taobao.com/*
        //                      to http://www.etao.com
        //using 302
        return new Promise((resolve, reject) => {
            if(req.headers.host == "www.taobao.com"){
                resolve(302);
            } else {
                resolve(statusCode);
            }
        });
    },

    replaceResponseHeader: function(req,res,headers){
        // in combination with 302, this is not required when replace statusCode
        return new Promise((resolve, reject) => {
            headers = Object.assign({}, headers);
            if(headers.host == "www.taobao.com"){
                headers.location = "http://www.etao.com";
            }
            resolve(headers);

        });
    }
};