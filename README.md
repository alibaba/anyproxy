AnyProxy
==========

[![NPM version][npm-image]][npm-url]
[![node version][node-image]][node-url]
[![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/anyproxy.svg?style=flat-square
[npm-url]: https://npmjs.org/package/anyproxy
[node-image]: https://img.shields.io/badge/node.js-%3E=_0.10-green.svg?style=flat-square
[node-url]: http://nodejs.org/download/
[download-image]: https://img.shields.io/npm/dm/anyproxy.svg?style=flat-square
[download-url]: https://npmjs.org/package/anyproxy

A fully configurable proxy in NodeJS, which can handle HTTPS requests perfectly.
(Chinese in this doc is nothing but translation of some key points. Be relax if you dont understand.)

[中文wiki - 代理服务器的新轮子](https://github.com/alibaba/anyproxy/wiki/%E4%BB%A3%E7%90%86%E6%9C%8D%E5%8A%A1%E5%99%A8%E7%9A%84%E6%96%B0%E8%BD%AE%E5%AD%90%EF%BC%9Aanyproxy) ，介绍我们为什么要再造一个代理服务器，anyproxy开放式的设计可以解决什么样的问题。

<img src="http://gtms04.alicdn.com/tps/i4/TB1XfxDHpXXXXXpapXX20ySQVXX-512-512.png" width="250" height="250" alt="anyproxy logo" />

特性
------------
* 支持https明文代理
* 支持低网速模拟
* 支持二次开发，可以用javascript控制代理的全部流程，搭建前端个性化调试环境
* 提供web版界面，观测请求情况

Feature
------------
* work as http or https proxy
* fully configurable, you could modify a request at any stage with your customized javascript code
* when working as https proxy, AnyProxy could intercept https requests for any domain without complaint by browser (after you trust its root CA)
* a web interface for you to watch realtime request details, where html with (almost) any charset could be shown correctly

Quick Start
--------------

### step 1 - install

* install [NodeJS](http://nodejs.org/)
* ``npm install -g anyproxy`` , may require ``sudo``
* python is optional, it will be OK if you get some error about it during installing.

### step 2 - start proxy server

* start with default settings : ``anyproxy``
* ...or start with a specific port:  ``anyproxy --port 8001``
* ...start with a rule file: ``anyproxy --rule ./rule_sample/rule_allow_CORS.js``

### step 3 - set up proxy settings in your browser , or system ,or mobile devices ,etc

* default proxy should be 127.0.0.1:8001 , or you_ip_address:8001 on remote devices

### step 4 - launch web interface

* visit [http://127.0.0.1:8002](http://127.0.0.1:8002) ,you will see realtime requests in your browser
* be sure to use web interface with modern browsers

![screenshot](http://gtms01.alicdn.com/tps/i1/TB1IdgqGXXXXXa9apXXLExM2pXX-854-480.gif)



Rule module
-------------------
* Rule module is the specialty for AnyProxy. Think it as a middleware, you could write your own code to hack requests at any stage, no matter it is about to response or the proxy just gets the request. In this way, AnyProxy would be flexible to meet your own demands.

* It's highly recommended to read this guide before using: [What is rule file and how to write one ?](https://github.com/alibaba/anyproxy/wiki/What-is-rule-file-and-how-to-write-one)

* An entire scheme of rule file could be found at [./rule_sample/rule__blank.js](https://github.com/alibaba/anyproxy/blob/master/rule_sample/rule__blank.js). Besides, there are some samples at [./rule_sample](https://github.com/alibaba/anyproxy/tree/master/rule_sample). That may help you a lot when writing your own rule files.


Https features
----------------
After configuring rootCA, AnyProxy could help to decrypt https requests, whose approach is also called Man-In-The-Middle(MITM).

A guide about configuring https features is here : [https://github.com/alibaba/anyproxy/wiki/How-to-config-https-proxy](https://github.com/alibaba/anyproxy/wiki/How-to-config-https-proxy) 

HTTPS配置中文教程 : [https://github.com/alibaba/anyproxy/wiki/HTTPS%E7%9B%B8%E5%85%B3%E6%95%99%E7%A8%8B](https://github.com/alibaba/anyproxy/wiki/HTTPS%E7%9B%B8%E5%85%B3%E6%95%99%E7%A8%8B)


Others
-----------------

#### to save request data
* to save request data to local file, use ``` anyproxy --file /path/to/file ```
* anyproxy uses [nedb](https://github.com/louischatriot/nedb) to save request data. Since NeDB's persistence uses an append-only format, you may get some redundant record in local file. For those dupplicated ones with the same id, just use the lastest line of record.
* [TrafficeRecorder](https://github.com/ottomao/TrafficRecorder) is another tool based on anyproxy to help recording all request data, including header and body. You may have a try.

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
    disableWebInterface : false, //optional, set it when you don't want to use the web interface
    silent        : false, //optional, do not print anything into terminal. do not set it when you are still debugging.
};
new proxy.proxyServer(options);

```

Contact
-----------------

* Please feel free to [raise issue](https://github.com/alibaba/anyproxy/issues), or give us some advice. :)
* AnyProxy用户旺旺群：1203077233


License
-----------------

* Apache License, Version 2.0
