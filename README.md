anyproxy
==========
A fully configurable proxy in NodeJS, which can handle HTTPS requests perfectly.

(Chinese in this doc is nothing but translation of some key points. Be relax if you dont understand.)

![](https://i.alipayobjects.com/i/ecmng/png/201409/3NKRCRk2Uf.png_250x.png)

Feature
------------
* work as http or https proxy
* fully configurable, you can modify a request at any stage by your own javascript code
* when working as https proxy, it can generate and intercept https requests for any domain without complaint by browser (after you trust its root CA)
* a web interface is availabe for you to view request details

![screenshot](http://gtms03.alicdn.com/tps/i3/TB1ddyqGXXXXXbXXpXXihxC1pXX-1000-549.jpg_640x640q90.jpg)
 
Usage
--------------

### step 1 - install

* install [NodeJS](http://nodejs.org/)
* ``npm install -g anyproxy`` , may require ``sudo``

### step 2 - start server

* start with default settings : ``anyproxy``
* start with a specific port:  ``anyproxy --port 8001``
* start with a rule file: ``anyproxy --rule ./rule_sample/rule_allow_CORS.js``

### step 3 - launch web interface

* visit [http://127.0.0.1:8002](http://127.0.0.1:8002) with modern browsers

How to write your own rule file
-------------------
* with rule file, you can modify a request at any stage, no matter it's just before sending or after servers' responding.
* actually ruleFile.js is a module for Nodejs, feel free to invoke your own modules.
* ``anyproxy --rule /path/to/ruleFile.js``
* you may learn how it works by our samples: [/alipay-ct-wd/anyproxy/tree/master/rule_sample](/alipay-ct-wd/anyproxy/tree/master/rule_sample)
* samples in [rule_sample](/alipay-ct-wd/anyproxy/tree/master/rule_sample)
    * **[rule__blank.js](/alipay-ct-wd/anyproxy/blob/master/rule_sample/rule__blank.js)**,
        * blank rule file with some comments. You may read this before writing your own rule file.
        * 空白的规则文件模板，和一些注释
    * **[rule_adjust_response_time.js](/alipay-ct-wd/anyproxy/blob/master/rule_sample/rule_adjust_response_time.js)**
        * delay all the response for 1500ms
        * 把所有的响应延迟1500毫秒
    * **[rule_allow_CORS.js](/alipay-ct-wd/anyproxy/blob/master/rule_sample/rule_allow_CORS.js)**
        * add CORS headers to allow cross-domain ajax request
        * 为ajax请求增加跨域头
    * **[rule_intercept_some_https_requests.js](/alipay-ct-wd/anyproxy/blob/master/rule_sample/rule_intercept_some_https_requests.js)**
        * intercept https requests toward github.com and append some data
        * 截获github.com的https请求，再在最后加点文字
    * **[rule_remove_cache_header.js](/alipay-ct-wd/anyproxy/blob/master/rule_sample/rule_remove_cache_header.js)**
        * remove all cache-related headers from server
        * 去除响应头里缓存相关的头
    * **[rule_replace_request_option.js](/alipay-ct-wd/anyproxy/blob/master/rule_sample/rule_replace_request_option.js)**
        * replace request parameters before sending to the server
        * 在请求发送到服务端前对参数做一些调整
    * **[rule_replace_response_data.js](/alipay-ct-wd/anyproxy/blob/master/rule_sample/rule_replace_response_data.js)**
        * modify response data
        * 修改响应数据
    * **[rule_replace_response_status_code.js](/alipay-ct-wd/anyproxy/blob/master/rule_sample/rule_replace_response_status_code.js)**
        * replace server's status code
        * 改变服务端响应的http状态码
    * **[rule_use_local_data.js](/alipay-ct-wd/anyproxy/blob/master/rule_sample/rule_use_local_data.js)**
        * map some requests to local file
        * 把响应映射到本地

* rule file scheme is as follows, you may also get it from [rule__blank.js](/alipay-ct-wd/anyproxy/blob/master/rule_sample/rule__blank.js)

```javascript

module.exports = {
    /*
    these functions will overwrite the default ones, write your own when necessary.
    */
    summary:function(){
        console.log("this is a blank rule for anyproxy");
    },

    //whether to intercept this request by local logic
    //if the return value is true, anyproxy will call dealLocalResponse to get response data and will not send request to remote server anymore
    shouldUseLocalResponse : function(req,reqBody){
        return false;
    },

    //you may deal the response locally instead of sending it to server
    //this function be called when shouldUseLocalResponse returns true
    //callback(statusCode,resHeader,responseData)
    //e.g. callback(200,{"content-type":"text/html"},"hello world")
    dealLocalResponse : function(req,reqBody,callback){
        callback(statusCode,resHeader,responseData)
    },

    //replace the request protocol when sending to the real server
    //protocol : "http" or "https"
    replaceRequestProtocol:function(req,protocol){
        var newProtocol = protocol;
        return newProtocol;
    },

    //req is user's request which will be sent to the proxy server, docs : http://nodejs.org/api/http.html#http_http_request_options_callback
    //you may return a customized option to replace the original option
    //you should not write content-length header in options, since anyproxy will handle it for you
    replaceRequestOption : function(req,option){
        var newOption = option;
        return newOption;
    },

    //replace the request body
    replaceRequestData: function(req,data){
        return data;
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

```

Using https features
----------------
#### step 1 - install openssl
* openssl is availabe here : [http://wiki.openssl.org/index.php/Compilation_and_Installation](http://wiki.openssl.org/index.php/Compilation_and_Installation) 
* using ``openssl version -a `` to make sure it is accessible via you command line.

#### step 2 - generate a rootCA and trust it
* you should do this when it is the first time to start anyproxy
* execute ``anyproxy --root`` ,follow the instructions on screen
* **[important!]you will see some tip like *rootCA generated at : /usr/lib...* . ``cd`` to that directory, add/trust the rootCA.crt file to your system keychain. In OSX, you may do that by open the *crt file directly**

#### step 3 - start a https proxy
* ``anyproxy --type https --host my.domain.com``
* the param ``host`` is required with https proxy and it should be kept exactly what it it when you config your browser. Otherwise, you may get some warning about security.


Others
-----------------
#### work as a module
```
npm install anyproxy --save
```

```javascript
var proxy = require("anyproxy");

//create cert when you want to use https features
//please manually trust this rootCA when it is the first time you run it
!proxy.isRootCAFileExists() && proxy.generateRootCA(); 

var options = {
    type     : "http",
    port     : "8001",
    hostname : "localhost",
    rule     : require("path/to/my/ruleModule.js")
};
new proxy.proxyServer(options);

```

#### clear all the temperary certificates
``anyproxy --clear``


## Contact
* Please feel free to raise any issue about this project, or give us some advice on this doc. :)
