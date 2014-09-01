//rule scheme :

module.exports = {
	shouldUseLocalResponse : function(req){
	},

	dealLocalResponse : function(req,callback){
	},

    replaceRequestOption : function(req,option){
        //replace request towards http://www.taobao.com 
        //                     to http://www.taobao.com/about/

        /*
        option scheme:
        {
            hostname : "www.taobao.com"
            port     : 80
            path     : "/"
            method   : "GET"
            headers  : {cookie:""}
        }
        */
        if(option.hostname == "www.taobao.com" && option.path == "/"){
            option.path = "/about/";
        }

        console.log(option);
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
    },

    shouldInterceptHttpsReq :function(req){
    }
};