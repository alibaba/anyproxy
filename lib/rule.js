module.exports = {
	/*
	thess functions are required
	you may leave their bodies blank if necessary
	*/

	//whether to intercept this request by local logic
	//if the return value is true, anyproxy will call dealLocalResponse to get response data and will not send request to remote server anymore
	shouldUseLocalResponse : function(req){
		if(req.method == "OPTIONS"){
			return true;
		}else{
			return false;
		}
	},

	//response to user via local logic, be called when shouldUseLocalResponse returns true
	//you should call callback(statusCode,resHeader,responseData)
	//e.g. callback(200,{"content-type":"text/html"},"hello world")
	dealLocalResponse : function(req,callback){
		if(req.method == "OPTIONS"){
			callback(200,mergeCORSHeader(req.headers),"");
		}
	},

	//req is user's request sent to the proxy server
	// option is how the proxy server will send request to the real server. i.e. require("http").request(option,function(){...})
	//you may return a customized option to replace the original option
    replaceRequestOption : function(req,option){
    	var newOption = option;

    	// newOption = {
    	// 	hostname : "www.example.com",
    	// 	port     : "80",
    	// 	path     : '/',
    	// 	method   : "GET",
    	// 	headers  : {}
    	// };
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
    replaceResponseHeader: function(req,res,header){
    	var newHeader = header;

    	newHeader = mergeCORSHeader(req.headers, newHeader);
    	newHeader = disableCacheHeader(newHeader);
    	return newHeader;
    },

    //replace the response from the server before it's sent to the user
    //you may return either a Buffer or a string
    //serverResData is a Buffer, you may get its content by calling serverResData.toString()
    replaceServerResData: function(req,res,serverResData){
        if(/html/i.test(res.headers['content-type'])){
        	var newDataStr = serverResData.toString(); //TODO : failed to decode data
            // newDataStr += "hello world!";
            return newDataStr;
        }else{
            return serverResData;
        }
    },

    //add a pause before sending response to user
    pauseBeforeSendingResponse : function(req,res){
    	var timeInMS = 100; //delay all requests for 0.1s
    	return timeInMS; 
    }

};

// https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS
function mergeCORSHeader(reqHeader,originHeader){
    var targetObj = originHeader || {};

    delete targetObj["Access-Control-Allow-Credentials"];
    delete targetObj["Access-Control-Allow-Origin"];
    delete targetObj["Access-Control-Allow-Methods"];
    delete targetObj["Access-Control-Allow-Headers"];

    targetObj["access-control-allow-credentials"] = "true";
    targetObj["access-control-allow-origin"]      = reqHeader['origin'] || "-___-||";
    targetObj["access-control-allow-methods"]     = "GET, POST, PUT";
    targetObj["access-control-allow-headers"]     = reqHeader['access-control-request-headers'] || "-___-||";

    return targetObj;
}


function disableCacheHeader(header){
	header = header || {};
	header["Cache-Control"]                    = "no-cache, no-store, must-revalidate";
	header["Pragma"]                           = "no-cache";
	header["Expires"]                          = 0;
	header["server"]                           = "anyproxy server";
	header["x-powered-by"]                     = "Anyproxy";

	return header;
}

//try to mactch rule file
// for(var index in handleRule.map){
//     var rule = handleRule.map[index];


//     var hostTest = new RegExp(rule.host).test(host),
//         pathTest = new RegExp(rule.path).test(path);

//     if(hostTest && pathTest && (rule.localFile || rule.localDir) ){
//         console.log("==>meet the rules, will map to local file");

//         var targetLocalfile = rule.localFile;

//         //localfile not set, map to dir
//         if(!targetLocalfile){ //find file in dir, /a/b/file.html -> dir + b/file.html
//             var remotePathWithoutPrefix = path.replace(new RegExp(rule.path),""); //remove prefix
//             targetLocalfile = pathUtil.join(rule.localDir,remotePathWithoutPrefix);
//         }

//         console.log("==>local file: " + targetLocalfile);
//         if(fs.existsSync(targetLocalfile)){
//             try{
//                 var fsStream = fs.createReadStream(targetLocalfile);
//                 userRes.writeHead(200,mergeCORSHeader( req.headers,{}) ); //CORS for localfiles
//                 fsStream.pipe(userRes);
//                 ifLocalruleMatched = true;
//                 break;
//             }catch(e){
//                 console.log(e.message);
//             }
//         }else{
//             console.log("file not exist : " + targetLocalfile);
//         }
//     }
// }