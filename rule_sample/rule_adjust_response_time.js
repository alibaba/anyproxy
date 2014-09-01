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

    },

    pauseBeforeSendingResponse : function(req,res){
        //delay all the response for 1500ms
        return 1500;
    },

    shouldInterceptHttpsReq :function(req){
    }
};