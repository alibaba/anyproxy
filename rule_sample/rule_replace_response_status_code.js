//rule scheme :

module.exports = {
	shouldUseLocalResponse : function(req){
	},

	dealLocalResponse : function(req,callback){
	},

    replaceRequestOption : function(req,option){

    },

    replaceRequestProtocol:function(req,protocol){
    },

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
    },

    replaceServerResData: function(req,res,serverResData){
    },

    pauseBeforeSendingResponse : function(req,res){
    },

    shouldInterceptHttpsReq :function(req){
    }
};