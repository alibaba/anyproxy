/*
read the following wiki before using rule file
https://github.com/alibaba/anyproxy/wiki/What-is-rule-file-and-how-to-write-one
*/
const Q = require('q');
module.exports = {
    /*
    These functions will overwrite the default ones, write your own when necessary.
    Comments in Chinese are nothing but a translation of key points. Be relax if you dont understand.
    致中文用户：中文注释都是只摘要，必要时请参阅英文文档。欢迎提出修改建议。
    */
    summary:function(){
        return "this is a blank rule for AnyProxy";
    },

    //=======================
    //when getting a request from user
    //收到用户请求之后
    //=======================

    //是否截获https请求
    //should intercept https request, or it will be forwarded to real server
    shouldInterceptHttpsReq :function(req){
        const d = Q.defer();
        d.resolve(false);
        return d.promise;
    },

    //是否在本地直接发送响应（不再向服务器发出请求）
    //whether to intercept this request by local logic
    //if the return value is true, anyproxy will call dealLocalResponse to get response data and will not send request to remote server anymore
    //req is the user's request sent to the proxy server
    shouldUseLocalResponse : function(req,reqBody){
        const d = Q.defer();
        d.resolve(false);
        return d.promise;
    },

    //如果shouldUseLocalResponse返回true，会调用这个函数来获取本地响应内容
    //you may deal the response locally instead of sending it to server
    //this function be called when shouldUseLocalResponse returns true
    //callback(statusCode,resHeader,responseData)
    //e.g. callback(200,{"content-type":"text/html"},"hello world")
    dealLocalResponse : function(req,reqBody,callback){
        const d = Q.defer();
        d.resolve({
            code: 200,
            header: {},
            body: 'the_body'
        });
        return d.promise;
    },



    //=======================
    //when ready to send a request to server
    //向服务端发出请求之前
    //=======================

    //替换向服务器发出的请求协议（http和https的替换）
    //replace the request protocol when sending to the real server
    //protocol : "http" or "https"
    replaceRequestProtocol:function(req,protocol){
        var newProtocol = protocol;
        const d = Q.defer();
        d.resolve(newProtocol);
        return d.promise;
    },

    //替换向服务器发出的请求参数（option)
    //option is the configuration of the http request sent to remote server. You may refers to http://nodejs.org/api/http.html#http_http_request_options_callback
    //you may return a customized option to replace the original one
    //you should not overwrite content-length header in options, since anyproxy will handle it for you
    replaceRequestOption : function(req,option){
        var newOption = option;
        const d = Q.defer();
        d.resolve(newOption);
        return d.promise;
    },

    //替换请求的body
    //replace the request body
    replaceRequestData: function(req,data){
        const d = Q.defer();
        d.resolve(data);
        return d.promise;
    },



    //=======================
    //when ready to send the response to user after receiving response from server
    //向用户返回服务端的响应之前
    //=======================

    //替换服务器响应的http状态码
    //replace the statusCode before it's sent to the user
    replaceResponseStatusCode: function(req,res,statusCode){
        var newStatusCode = statusCode;
        const d = Q.defer();
        d.resolve(newStatusCode);
        return d.promise;
    },

    //替换服务器响应的http头
    //replace the httpHeader before it's sent to the user
    //Here header == res.headers
    replaceResponseHeader: function(req,res,header){
        var newHeader = header;
        const d = Q.defer();
        d.resolve(newHeader);
        return d.promise;
    },

    //替换服务器响应的数据
    //replace the response from the server before it's sent to the user
    //you may return either a Buffer or a string
    //serverResData is a Buffer. for those non-unicode reponse , serverResData.toString() should not be your first choice.
    replaceServerResData: function(req,res,serverResData){
        const newServerResData = Object.assign({}, serverResData);
        const d = Q.defer();
        d.resolve(newServerResData);
        return d.promise;
    },

    //Deprecated
    // replaceServerResData: function(req,res,serverResData){
    //     return serverResData;
    // },

    //在请求返回给用户前的延迟时间
    //add a pause before sending response to user
    pauseBeforeSendingResponse : function(req,res){
        var timeInMS = 1; //delay all requests for 1ms
        return timeInMS;
    }

};