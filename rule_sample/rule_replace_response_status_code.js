//rule scheme :

module.exports = {

    replaceResponseStatusCode: function(req,res,statusCode){
        //redirect requests toward http://www.taobao.com/*
        //                      to http://www.etao.com
        //using 302

        if(req.headers.host == "www.taobao.com"){
            statusCode = 302;
        }

        return statusCode;
    },

    replaceResponseHeader: function(req,res,header){
        if(req.headers.host == "www.taobao.com"){
            header.location = "http://www.etao.com";
        }

        return header;
    }
};