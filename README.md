AnyProxy
===================

> 本文档的适用范围是AnyProxy 4.0，此版本当前正在beta中，欢迎提供反馈

AnyProxy是一个开放式的HTTP代理服务器。

主要特性包括：

* 基于Node.js，开放二次开发能力，允许自定义请求处理逻辑
* 支持Https的解析
* 提供GUI界面，用以观察请求

相比3.x版本，AnyProxy 4.0的主要变化：

* 规则文件（Rule）全面支持Promise和Generator
* 简化了规则文件内的接口
* Web版界面重构

## 快速上手

### 安装

```bash
npm install -g anyproxy@beta #本文档对应的AnyProxy为4.0Beta版
```

### 启动

* 命令行启动AnyProxy，默认端口号8001

```bash
anyproxy
```

* 启动后将终端http代理服务器配置为127.0.0.1:8001即可
* 访问http://127.0.0.1:8002，web界面上能看到所有的请求信息

### 其他命令

* 配置启动端口，如1080端口启动

```bash
anyproxy --port 1080
```

* [附录：如何配置系统、浏览器、手机代理服务器](#osx-proxy)

## 代理https请求

* AnyProxy默认不对https请求做处理，如需看到明文信息，需要配置CA证书

> 解析https请求的原理是中间人攻击（man-in-the-middle），用户必须信任AnyProxy生成的CA证书，才能进行后续流程

* 生成证书并解析所有https请求

```bash
anyproxy-ca #生成rootCA证书，生成后需要手动信任
anyproxy --intercept #启动AnyProxy，并解析所有https请求
```

* [附录：如何信任CA证书](#osx-trust-ca)

## 规则模块（Rule）

AnyProxy提供了二次开发的能力，你可以用js编写自己的规则模块（rule），来自定义网络请求的处理逻辑。

>注意：引用规则前，请务必确保文件来源可靠，以免发生安全问题

规则模块的能力范围包括：

* 拦截并修改正在发送的请求
  * 可修改内容包括请求头（request header)，请求体（request body），甚至是请求的目标地址等
* 拦截并修改服务端响应
  * 可修改的内容包括http状态码(status code)、响应头（response header）、响应内容等
* 拦截https请求，对内容做修改
  * 本质是中间人攻击（man-in-the-middle attack），需要客户端提前信任AnyProxy生成的CA

### 开发示例

* 举例
  * 需要编写一个规则模块，在 GET http://httpbin.org/user-agent 的返回值里加上测试信息，并延迟5秒返回

* Step 1，编写规则

  ```js
  // file: sample.js
  module.exports = {
    summary() { return 'a rule to modify response'; },
    *beforeSendResponse(requestDetail, responseDetail) {
      if (requestDetail.url === 'http://httpbin.org/user-agent') {
        const newResponse = responseDetail.response;
        newResponse.body += '-- AnyProxy Hacked! --';
        return new Promise((resolve, reject) => {
          setTimeout(() => { // delay
            resolve({ response: newResponse });
          }, 5000);
        });
      }
    },
  };
  ```

* Step 2, 启动AnyProxy，加载规则
  * 运行 `anyproxy --rule sample.js`

* Step 3, 测试规则

  * 用curl测试 
    ```bash
    curl http://httpbin.org/user-agent --proxy http://127.0.0.1:8001
    ```

  * 用浏览器测试：配置浏览器http代理为 127.0.0.1:8001，访问 http://httpbin.org/user-agent 

  * 经过代理服务器后，期望的返回如下
  ```
  {
    "user-agent": "curl/7.43.0"
  }
  - AnyProxy Hacked!
  ```

* Step 4, 查看请求信息

  * 浏览器访问http://127.0.0.1:8002，界面上能看到刚才的请求信息

### 处理流程

* 当http请求经过代理服务器时，代理服务器的处理流程是：
  * 收集请求所有请求参数，包括method, header, body等
  * AnyProxy调用规则模块`beforeSendRequest`方法，由模块做处理，返回新的请求参数，或返回响应内容
  * 如果`beforeSendRequest`返回了响应内容，则立即把此响应返回到客户端（而不再发送到真正的服务端），流程结束。
  * 根据请求参数，向服务端发出请求，接收服务端响应。
  * 调用规则模块`beforeSendResponse`方法，由模块对响应内容进行处理
  * 把响应信息返回给客户端

* 当代理服务器收到https请求时，AnyProxy可以替换证书，对请求做明文解析。
  * 调用规则模块`beforeDealHttpsRequest`方法，如果返回`true`，会明文解析这个请求，其他请求不处理
  * 被明文解析后的https请求，处理流程同http一致。未明文解析请求不会再进入规则模块做处理。

* 完整的请求处理流程如下，供参考
![](https://zos.alipayobjects.com/rmsportal/TWyNuSJtEZBdrdcOMRjE.png@600w)

### 如何引用

如下几种方案都可以用来引用规则模块：

* 使用本地路径
```bash
anyproxy --rule ./rule.js
```
* 使用在线地址
```bash
anyproxy --rule https://sample.com/rule.js
```

* 使用npm包
  * AnyProxy使用`require()`加载本地规则，你可以在参数里传入一个本地的npm包路径，或是某个全局安装的npm包
```bash
anyproxy --rule ./myRulePkg/ #本地包
npm i -g myRulePkg && anyproxy --rule myRulePkg #全局包
``` 

### 接口详解

规则模块应该符合cmd规范，一个典型的规则模块代码结构如下

```js
module.exports = {
  summary() { return 'my customized rule for AnyProxy'; },
  *beforeSendRequest(requestDetail) { /* ... */ },
  *beforeSendResponse(requestDetail, responseDetail) { /* ... */ },
  *beforeDealHttpsRequest(requestDetail) { /* ... */ }
};
```

#### `summary()`

* 返回规则模块介绍，用于AnyProxy提示用户

#### `beforeSendRequest(requestDetail)`

* AnyProxy向服务端发送请求前，会调用`beforeSendRequest`，并带上参数`requestDetail`
* `requestDetail` 
  * `protocol` {string} 请求使用的协议，http或者https
  * `requestOptions` {object} 即将发送的请求配置，供require('http').request作为使用。详见：https://nodejs.org/api/http.html#http_http_request_options_callback
  * `requestData` {object} 请求Body
  * `url` {string} 请求url
  * `_req` {object} 请求的原始request
* 举例：请求 *anyproxy.io* 时，requestDetail参数内容大致如下

  ```js
  {
    protocol: 'http',
    url: 'http://anyproxy.io/',
    requestOptions: {
      hostname: 'anyproxy.io',
      port: 80,
      path: '/',
      method: 'GET',
      headers: {
        Host: 'anyproxy.io',
        'Proxy-Connection': 'keep-alive',
        'User-Agent': '...'
      }
    },
    requestData: '...',
    _req: { /* ... */}
  }
  ```

* 以下几种返回都是合法的
  * 不做任何处理，返回null

  ```js 
  return null;
  ```

  * 修改请求协议，如强制改用https发起请求

  ```js
  return {
    protocol: 'https'
  };
  ```

  * 修改请求参数

  ```js
  var newOption = Object.assign({}, requestDetail.requestOptions);
  newOption.path = '/redirect/to/another/path';
  return {
    requestOptions: newOption
  };
  ```
  * 修改请求body

  ```js
  return {
    requestData: 'my new request data'
    //这里也可以同时加上requestOptions
  };
  ```
  * 直接返回客户端，不再发起请求

  ```js
  return {
    statusCode: 200,
    header: { 'content-type': 'text/html' },
    body: 'this could be a <string> or <buffer>'
  };
  ```

#### `beforeSendResponse(requestDetail, responseDetail)`

* AnyProxy向客户端发送请求前，会调用`beforeSendResponse`，并带上参数`requestDetail` `responseDetail`
* `requestDetail` 同`beforeSendRequest`中的参数
* `responseDetail` 
  * `response` {object} 服务端的返回信息，包括`statusCode` `header` `body`三个字段
  * `_res` {object} 原始的服务端返回对象
* 举例，请求www.qq.com时，responseDetail参数内容大致如下
* 以下几种返回都是合法的
  * 不做任何处理，返回null
  ```js 
  return null;
  ```
  * 修改返回的状态码

```js
var newResponse = Object.assign({}, responseDetail.reponse);
newResponse.statusCode = 404;
return {
  response: newResponse
};
```

  * 修改返回的内容

```js
var newResponse = Object.assign({}, responseDetail.reponse);
newResponse.body += '--from anyproxy--';
return {
  response: newResponse
};
```

#### `beforeDealHttpsRequest(requestDetail)`

* AnyProxy收到https请求时，会调用`beforeDealHttpsRequest`，并带上参数`requestDetail`
* 如果配置了全局解析https的参数，则AnyProxy会略过这个调用
* 只有返回`true`时，AnyProxy才会尝试替换证书、解析https。否则只做数据流转发，无法看到明文数据。
* 注意：https over http的代理模式中，这里的request是CONNECT请求
* `requestDetail`
  * `host` {string} 请求目标的Host，受制于协议，这里无法获取完整url
  * `_req` {object} 请求的原始request
* 返回值
  * `true`或者`false`，是否需要AnyProxy解析https

### 更多规则模块样例

`rule_sample`目录下提供了一些规则模块的案例，供参考。

* 使用本地数据 sample_use_local_response.js
* 修改请求头 sample_modify_request_header.js
* 修改请求数据 sample_modify_request_data.js
* 修改请求的目标地址 sample_modify_request_path.js
* 修改请求协议 sample_modify_request_protocol.js
* 修改返回状态码 sample_modify_response_statuscode.js
* 修改返回头 sample_modify_response_header.js
* 修改返回内容，并延迟5秒 sample_modify_response_data.js

## AnyProxy作为npm包使用

AnyProxy可以作为一个npm包使用，整合进其他工具。
注意：如要启用https解析，请在代理服务器启动前自行调用`AnyProxy.utils.certMgr`相关方法生成证书，并引导用户信任安装。

* 引入
 
```bash
npm i anyproxy --save
```

* 使用举例

```js
const AnyProxy = require('anyproxy');
const options = {
  port: 8001,
  rule: require('myRuleModule'),
  webInterface: {
    enable: true,
    webPort: 8002,
    wsPort: 8003,
  },
  throttle: 10000,
  forceProxyHttps: false,
  silent: false
};
const proxyServer = new AnyProxy.ProxyServer(options);

proxyServer.on('ready', () => { /* */ });
proxyServer.on('error', (e) => { /* */ });
proxyServer.start();

//when finished
proxyServer.close();
```

* Class: `AnyProxy.proxyServer`
  * 创建代理服务器

    ```js
    const proxy = new AnyProxy.proxyServer(options)
    ```

  * `options`
    * `port` {number} 必选，代理服务器端口
    * `rule` {object} 自定义规则模块
    * `throttle` {number} 限速值，单位kb/s，默认不限速
    * `forceProxyHttps` {boolean} 是否强制拦截所有的https，忽略规则模块的返回，默认`false`
    * `silent` {boolean} 是否屏蔽所有console输出，默认`false`
    * `dangerouslyIgnoreUnauthorized` {boolean} 是否忽略请求中的证书错误，默认`false`
    * `webInterface` {object} web版界面配置
      * `enable` {boolean} 是否启用web版界面，默认`false`
      * `webPort` {number} web版界面端口号，默认`8002`
      * `wsPort` {number} web版界面的ws端口号，默认`8003`
  * Event: `ready`
    * 代理服务器启动完成
    * 示例

    ```js
    proxy.on('ready', function() { })
    ```

  * Event: `error`
    * 代理服务器发生错误
    * 示例

    ```js
    proxy.on('error', function() { })
    ```
  * Method: `start`
    * 启动代理服务器
    * 示例

    ```js
    proxy.start();
    ```
  * Method: `close`
    * 关闭代理服务器
    * 示例

    ```js
    proxy.close();
    ```
* `AnyProxy.utils.systemProxyMgr`
  * 管理系统的全局代理配置，方法调用时可能会弹出密码框
  * 使用示例

  ```js
  // 配置127.0.0.1:8001为全局http代理服务器
  AnyProxy.utils.systemProxyMgr.enableGlobalProxy('127.0.0.1', '8001');    

  // 关闭全局代理服务器
  AnyProxy.utils.systemProxyMgr.disableGlobalProxy();
  ```

* `AnyProxy.utils.certMgr`
  * 管理AnyProxy的证书
  * `AnyProxy.utils.certMgr.ifRootCAFileExists()`
    * 校验系统内是否存在AnyProxy的根证书
  * `AnyProxy.utils.certMgr.generateRootCA(callback)`
    * 生成AnyProxy的rootCA，完成后请引导用户信任.crt文件
  * 样例

  ```js
    const AnyProxy = require('AnyProxy');
    const exec = require('child_process').exec;

    if (!AnyProxy.utils.certMgr.ifRootCAFileExists()) {
      AnyProxy.utils.certMgr.generateRootCA((error, keyPath) => {
        // let users to trust this CA before using proxy
        if (!error) {
          const certDir = require('path').dirname(keyPath);
          console.log('The cert is generated at', certDir);
          const isWin = /^win/.test(process.platform);
          if (isWin) {
            exec('start .', { cwd: certDir });
          } else {
            exec('open .', { cwd: certDir });
          }
        } else {
          console.error('error when generating rootCA', error);
        }
      });
    }
  ```


## 关于AnyProxy

* AnyProxy是支付宝前端团队推出的开源产品
* Change Log: https://github.com/alibaba/anyproxy/blob/master/CHANGELOG
* 代码库：https://github.com/alibaba/anyproxy
* issue反馈：https://github.com/alibaba/anyproxy/issues


## FAQ

Q: 解析https时，是否需要配置https代理服务器？
A: 只需配置http代理服务器即可，AnyProxy支持 **CONNECT** 请求，可以使https请求经过http代理服务器


## 附录

### <a name="osx-trust-ca">如何在OSX系统信任CA证书</a>

* 类似这种报错都是因为系统没有信任AnyProxy生成的CA所造成的

![](https://zos.alipayobjects.com/rmsportal/CBkLGYgvoHAYwNVAYkpk.png@600w)

> 警告：请自己生成CA并妥善保管，以确保系统安全

安装CA：

* 双击打开rootCA.crt

* 确认将证书添加到login或system

![](https://zos.alipayobjects.com/rmsportal/bCwNUFFpvsmVuljQKrIk.png@400w)

* 找到刚刚导入的AnyProxy证书，配置为信任

![](https://zos.alipayobjects.com/rmsportal/nWWgLnxnmqLIKQqnXCxC.png@500w)

### 如何在Windows系统信任CA证书

![https://t.alipayobjects.com/tfscom/T1D3hfXeFtXXXXXXXX.jpg_700x.jpg](https://t.alipayobjects.com/tfscom/T1D3hfXeFtXXXXXXXX.jpg_700x.jpg)

### <a name="osx-proxy">如何配置OSX系统代理</a>

* 在wifi高级设置中，配置http代理即可

![](https://zos.alipayobjects.com/rmsportal/vduwhobSTypTfgniBvoa.png@500w)


### <a name="browser-proxy">如何配置浏览器HTTP代理</a>

* 以Chrome的[SwitchyOmega插件](https://chrome.google.com/webstore/detail/padekgcemlokbadohgkifijomclgjgif)为例

![](https://zos.alipayobjects.com/rmsportal/jIPZrKmqXRaSledQeJUJ.png)


### <a name="mobile-proxy">如何配置iOS/Android系统HTTP代理</a>

* 代理服务器都在wifi设置中配置

* iOS HTTP代理配置

![](https://zos.alipayobjects.com/rmsportal/tLGqIozhffTccUgPakuw.png@300w)

* Android HTTP代理配置

![](http://alipay-os.oss-cn-hangzhou-zmf.aliyuncs.com/rmsportal/xEMKcQifsevRbfUWUejf.png)