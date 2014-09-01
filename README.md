anyproxy
==========
A fully configurable proxy in NodeJS, which can handle HTTPS requests perfectly.

Feature
------------
* work as http or https proxy
* fully configurable, you can write your own rule file in javascript to change users' request or modify response
* when working as https proxy, it can generate and intercept https requests for any domain without complaint by browser (after you trust its root CA)
 
Usage
--------------

### step 1 - install

* install [NodeJS](http://nodejs.org/)
* ``npm install -g anyproxy`` , may require ``sudo``

### step 2 - start server

* start with default settings : ``anyproxy``
* start with a specific port:  ``anyproxy --port 8001``

How to write your own rule file
-------------------
* with rule file, you can modify a request at any stage, no matter it's before sending or after servers' responding.
* actually ruleFile.js is a module for Nodejs, feel free to include your own modules.
* ``anyproxy --rule /path/to/ruleFile.js``
* you may learn how it works by our samples: [https://github.com/alipay-ct-wd/anyproxy/tree/master/rule_sample](https://github.com/alipay-ct-wd/anyproxy/tree/master/rule_sample)
* rule file scheme
```javascript
module.exports = {
    /*
    thess functions are required
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
```

Using https features
----------------
### install openssl
* install [openssl](http://wiki.openssl.org/index.php/Compilation_and_Installation) ,if you want to use HTTPS-related features. After that, the command ``openssl`` should be exposed to your shell

### generate a rootCA and trust it
* you should do this when it is the first time to start anyproxy
* execute ``anyproxy --root`` ,follow the instructions on screen
* you will see some tip like *rootCA generated at : /usr/lib...* . ``cd`` to that directory, add/trust the rootCA.crt file to your system keychain. In OSX, you may do that by open the *crt file directly

### start a https proxy
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

!proxy.isRootCAFileExists() && proxy.generateRootCA();
new proxy.proxyServer("http","8001", "localhost" ,"path/to/rule/file");

```

#### clear all the temperary certificates
* ``anyproxy --clear``


## Contact
* Please feel free to raise any issue about this project, or give us some advice on this doc. :)
