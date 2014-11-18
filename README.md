anyproxy
==========
A fully configurable proxy in NodeJS, which can handle HTTPS requests perfectly.

[wiki - 代理服务器的新轮子](https://github.com/alibaba/anyproxy/wiki/%E4%BB%A3%E7%90%86%E6%9C%8D%E5%8A%A1%E5%99%A8%E7%9A%84%E6%96%B0%E8%BD%AE%E5%AD%90%EF%BC%9Aanyproxy) ，介绍我们为什么要再造一个代理服务器，anyproxy与众不同的结构与功能。

![](https://i.alipayobjects.com/i/ecmng/png/201409/3NKRCRk2Uf.png_250x.png)


Feature
------------
* work as http or https proxy
* fully configurable, you can modify a request at any stage by your own javascript code
* when working as https proxy, it can generate and intercept https requests for any domain without complaint by browser (after you trust its root CA)
* a web interface is availabe for you to view request details
* (beta)a web UI interface for you to replace some remote response with local data
* (Chinese in this doc is nothing but translation of some key points. Be relax if you dont understand.)

![screenshot](http://gtms03.alicdn.com/tps/i3/TB1ddyqGXXXXXbXXpXXihxC1pXX-1000-549.jpg_640x640q90.jpg)
 
Usage
--------------

### step 1 - install

* install [NodeJS](http://nodejs.org/)
* ``npm install -g anyproxy`` , may require ``sudo``
* python is optional, it will be OK if you get some error about it during installing.

### step 2 - start server

* start with default settings : ``anyproxy``
* start with a specific port:  ``anyproxy --port 8001``
* start with a rule file: ``anyproxy --rule ./rule_sample/rule_allow_CORS.js``

### step 3 - launch web interface

* visit [http://127.0.0.1:8002](http://127.0.0.1:8002) with modern browsers

Rule module
-------------------
* Rule module is the specialty for anyproxy. Unlike other proxy, here you could write your own code to hack requests at any stage, no matter it is about to response or the proxy just gets the request. In this way, it would be much more flexible to meet your own demands.

* It's highly recommended to read this guide before using: [What is rule file and how to write one ?](https://github.com/alibaba/anyproxy/wiki/What-is-rule-file-and-how-to-write-one)
![](https://t.alipayobjects.com/images/T1v8pbXjJqXXXXXXXX.png)

* Besides, we provide some samples rules in ./rule_sample
    * **[rule__blank.js](./rule_sample/rule__blank.js)**,
        * blank rule file with some comments. You may read this before writing your own rule file.
        * 空白的规则文件模板，和一些注释
    * **[rule_adjust_response_time.js](./rule_sample/rule_adjust_response_time.js)**
        * delay all the response for 1500ms
        * 把所有的响应延迟1500毫秒
    * **[rule_allow_CORS.js](./rule_sample/rule_allow_CORS.js)**
        * add CORS headers to allow cross-domain ajax request
        * 为ajax请求增加跨域头
    * **[rule_intercept_some_https_requests.js](./rule_sample/rule_intercept_some_https_requests.js)**
        * intercept https requests toward github.com and append some data
        * 截获github.com的https请求，再在最后加点文字
    * **[rule_remove_cache_header.js](./rule_sample/rule_remove_cache_header.js)**
        * remove all cache-related headers from server
        * 去除响应头里缓存相关的头
    * **[rule_replace_request_option.js](./rule_sample/rule_replace_request_option.js)**
        * replace request parameters before sending to the server
        * 在请求发送到服务端前对参数做一些调整
    * **[rule_replace_response_data.js](./rule_sample/rule_replace_response_data.js)**
        * modify response data
        * 修改响应数据
    * **[rule_replace_response_status_code.js](./rule_sample/rule_replace_response_status_code.js)**
        * replace server's status code
        * 改变服务端响应的http状态码
    * **[rule_use_local_data.js](./rule_sample/rule_use_local_data.js)**
        * map some requests to local file
        * 把图片响应映射到本地


Using https features
----------------
After configuring rootCA, anyproxy could help to decrypt https requests, whose approach is also called Man-In-The-Middle(MITM).

#### step 1 - install openssl
* openssl is availabe here : [http://wiki.openssl.org/index.php/Compilation_and_Installation](http://wiki.openssl.org/index.php/Compilation_and_Installation) 
* using ``openssl version -a `` to make sure it is accessible via you command line.

#### step 2 - generate a rootCA and trust it
* you should do this when it is the first time to start anyproxy
* execute ``sudo anyproxy --root`` ,follow the instructions on screen
* [important!]you will see some tip like *rootCA generated at : ~/.anyproxy_certs... . ``cd`` to that directory, add/trust the rootCA.crt file to your system keychain. In OSX, you may do that by open the \*.crt file directly
* when debug https requests, you have to trust this rootCA on all of your clients.

#### to intercept(decrypt) https requests
* start your anyproxy as normal. When rootCA is generated, it will intercept all the https requests for you automatically.
* if you get a warning like 'unsafe connection', please check if the root CA is correctly trusted .

#### to start an https proxy
* ``anyproxy --type https --host my.domain.com``
* the param ``host`` is required with https proxy and it should be kept exactly what it it when you config your browser. Otherwise, you may get some warning about security.
* using **https proxy** means your request towards proxy will be encrypted. Please notice that this feature has nothing to do with **intercept https requests**.

#### about certs
* root certs and temperary certs are stored at ``path.join(util.getUserHome(),"/.anyproxy_certs/")``
* to get the rootCA.crt file , you may either find it in local dir or download it via anyproxy web interface
* to clear all the temperary certificates ``anyproxy --clear``
* https features may be unstable in windows

Others
-----------------

#### to save request data 
* to save request data to local file, use ``` anyproxy --file /path/to/file ```
* anyproxy uses [nedb](https://github.com/louischatriot/nedb) to save request data. Since NeDB's persistence uses an append-only format, you may get some redundant record in local file. For those dupplicated ones with the same id, just use the lastest line of record.
* [TrafficeRecorder](https://github.com/ottomao/TrafficRecorder) is another tool based on anyproxy to help recording all requests. You may have a try.

#### throttling
* for instance, ``` anyproxy --throttle 10 ``` sets the speed limit to 10kb/s (kbyte/sec)
* this is just a rough throttling for downstream, not for network simulation

#### work as a module for nodejs
* use it as a module and develop your own proxy.

```
npm install anyproxy --save
```

```javascript
var proxy = require("anyproxy");

//create cert when you want to use https features
//please manually trust this rootCA when it is the first time you run it
!proxy.isRootCAFileExists() && proxy.generateRootCA(); 

var options = {
    type          : "http",
    port          : 8001,
    hostname      : "localhost",
    rule          : require("path/to/my/ruleModule.js"),
    dbFile        : null,  // optional, save request data to a specified file, will use in-memory db if not specified
    webPort       : 8002,  // optional, port for web interface
    socketPort    : 8003,  // optional, internal port for web socket, replace this when it is conflict with your own service
    webConfigPort : 8088,  // optional, internal port for web config(beta), replace this when it is conflict with your own service
    throttle      : 10,    // optional, speed limit in kb/s 
    disableWebInterface : false //optional, set it when you don't want to use the web interface
};
new proxy.proxyServer(options);

```

Contact
-----------------

* Please feel free to [raise issue](https://github.com/alibaba/anyproxy/issues), or give us some advice. :)
* anyproxy用户旺旺群：1203077233


License
-----------------

* Apache License, Version 2.0
