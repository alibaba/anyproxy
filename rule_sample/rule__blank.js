module.exports = {
	/*
	these functions are required
	you may leave their bodies blank if necessary
	*/

	//whether to intercept this request by local logic
	//if the return value is true, anyproxy will call dealLocalResponse to get response data and will not send request to remote server anymore
	shouldUseLocalResponse : function(req){
		return false;
	},

    //you may deal the response locally instead of sending it to server
    //this function be called when shouldUseLocalResponse returns true
	//callback(statusCode,resHeader,responseData)
	//e.g. callback(200,{"content-type":"text/html"},"hello world")
	dealLocalResponse : function(req,callback){
        //callback(statusCode,resHeader,responseData)
	},

	//req is user's request sent to the proxy server
	// option is how the proxy server will send request to the real server. i.e. require("http").request(option,function(){...})
	//you may return a customized option to replace the original option
    replaceRequestOption : function(req,option){
    	var newOption = option;
    	return newOption;
    },

    //replace the request protocol when sending to the real server
    //protocol : "http" or "https"
    replaceRequestProtocol:function(req,protocol){
    	var newProtocol = protocol;
    	return newProtocol;
    },

    //replace the statusCode before it's sent to the user
    replaceResponseStatusCode: function(req,res,statusCode){
    	var newStatusCode = statusCode;
    	return newStatusCode;
    },

    //replace the httpHeader before it's sent to the user
    //Here header == res.headers
    replaceResponseHeader: function(req,res,header){
    	var newHeader = header;
    	return newHeader;
    },

    //replace the response from the server before it's sent to the user
    //you may return either a Buffer or a string
    //serverResData is a Buffer, you may get its content by calling serverResData.toString()
    replaceServerResData: function(req,res,serverResData){
        return serverResData;
    },

    //add a pause before sending response to user
    pauseBeforeSendingResponse : function(req,res){
    	var timeInMS = 1; //delay all requests for 1ms
    	return timeInMS; 
    },

    //should intercept https request, or it will be forwarded to real server
    shouldInterceptHttpsReq :function(req){
        return false;
    }

};