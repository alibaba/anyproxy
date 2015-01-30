The following are sample rules.

* rule__blank.js
    * blank rule file with some comments. You may read this before writing your own rule file.
    * 空白的规则文件模板，和一些注释
* rule_adjust_response_time.js
    * delay all the response for 1500ms
    * 把所有的响应延迟1500毫秒
* rule_allow_CORS.js
    * add CORS headers to allow cross-domain ajax request
    * 为ajax请求增加跨域头
* rule_intercept_some_https_requests.js
    * intercept https requests toward github.com and append some data
    * 截获github.com的https请求，再在最后加点文字
* rule_remove_cache_header.js
    * remove all cache-related headers from server
    * 去除响应头里缓存相关的头
* rule_replace_request_option.js
    * replace request parameters before sending to the server
    * 在请求发送到服务端前对参数做一些调整
* rule_replace_response_data.js
    * modify response data
    * 修改响应数据
* rule_replace_response_status_code.js
    * replace server's status code
    * 改变服务端响应的http状态码
* rule_reverse_proxy.js
    * assign a specific ip address for request
    * 为请求绑定目标ip
* rule_use_local_data.js
    * map some requests to local file
    * 把图片响应映射到本地