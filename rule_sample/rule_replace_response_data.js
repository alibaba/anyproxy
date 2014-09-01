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
    },

    replaceResponseHeader: function(req,res,header){
    },

    replaceServerResData: function(req,res,serverResData){

        //append "hello world" to all web pages
        if(/html/i.test(res.headers['content-type'])){
            var newDataStr = serverResData.toString();
            newDataStr += "hello world!";
            return newDataStr;
        }else{
            return serverResData;
        }

    },

    pauseBeforeSendingResponse : function(req,res){
    },

    shouldInterceptHttpsReq :function(req){
    }
};