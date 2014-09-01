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
        //add "hello github" to all github pages
        if(req.headers.host == "github.com"){
            serverResData += "hello github";
        }
        return serverResData;
    },

    pauseBeforeSendingResponse : function(req,res){
    },

    shouldInterceptHttpsReq :function(req){
        //intercept https://github.com/
        //otherwise, all the https traffic will not go through this proxy

        if(req.headers.host == "github.com"){
            return true;
        }else{
            return false;
        }
    }
};