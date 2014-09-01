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
        header = header || {};
        header["Cache-Control"]                    = "no-cache, no-store, must-revalidate";
        header["Pragma"]                           = "no-cache";
        header["Expires"]                          = 0;

        return header;
    },

    replaceServerResData: function(req,res,serverResData){
    },

    pauseBeforeSendingResponse : function(req,res){
    },

    shouldInterceptHttpsReq :function(req){
    }

};

function disableCacheHeader(header){

}