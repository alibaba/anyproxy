# Rule Lifecycle API
AnyProxy exports certain lifecycle APIs for customize use, so you can reinforce it's ability on demand. We also have some sample for the rules, find them [here](/rule_sample).


 All APIs, except the `summary()`, are **async**. When you implement those lifecycle methods, you should return a **Promise** , and pass the data through the `resolve()` method.

> **TIPS**: AnyProxy only accepts the data passed in the `resolve(data)`. If your promise is `rejected` or, there are uncacthed exceptions throwed up, AnyProxy will drop the original request, and a `502 Proxy Inner Error` will be returned. *(for HTTPS, chrome will treate the `502` as ::ERR_TUNNER_CONNECTION_FAILED)*


## summary()
- **Returns:**
  - `{String}` The summary of the rule, will be printed when AnyProxy is starting. Useful when we load our custom rule, and we want to ensure the rule is loaded.

## shouldUseLocalResponse(req, reqBody)
- **Description**:
  - Called before the request is actually sent out.
  - When you want to deal some request with local response, inject this method and return true, then handle it in `dealLocalResponse()`.
  -  It's useful when you want to debug some remote resources with local file instead.

- **Arguments**:
  -   `{Object} req`
  -  `{String} reqBody`

- **Returned Promise**:
    -  `resolve({bool})`

## dealLocalResponse(req, reqBody)
- **Description:**
  - Handle the request with local response, AnyProxy will take the *resolved()* data as response.
  - Before the method triggered, please ensure the request has been marked *true* by `shouldUseLocalResponse()`

- **Arguments**:
  - `{Object} req`
  - `{String} reqBody`
- **Returned Promise**:
  - `resolve{Object}`

- **Resolve(obj)**

> Since the `resolve()` only accept one prameter,  we can only accept an object. The following **keys** will be the one in the Object passed to `resolve()`.

|Name|Type|Desc|
|:--:|:--:|:--:|
|`obj.code`|`{number}`|The status code for the response|
|`obj.header`|`{object}`|The header object for the response|
|`obj.body`|`{string}`|The body of the response|

- **Sample:**
  -  [rule_use_local_data.js](/rule_sample/rule_use_local_data.js)


## replaceRequestProtocol(req, reqProtocol)

- **Description:**
  -  Triggered before the request is sent out.
  -  Replace the original protocol to a new one, the resolved value should be `http` or `https` only.

- **Arguments:**
  - `{Object} req`
  - `{String} reqProtocol`  Be *http* or *https*

- **Returned Promise:**
  - `{String} protocol` Be *http* or *https*

- **Sample:**
  - [rule_replace_request_protocol.js](/rule_sample/rule_replace_request_protocol.js)

## replaceRequestOption(req, options)
- **Description:**
  - Triggered before the request is sent out
  - The options usually contains the target host / path / request headers ,etc.
  - Replace the options, the returned options should be a complete one.
  - You may use `require('http').request('options')` to debug your options.

- **Arguments:**
  - `{Object} req`
  - `{Object} options` *Refer to the [HTTP Options][https://nodejs.org/api/http.html#http_http_request_options_callback]*

- **Returned Promise:**
  - `{Object} options` *AnyProxy will request with the whole new returned options.*

- **Sample:**
  -  [rule_replace_request_option.js](/rule_sample/rule_replace_request_option.js)

> *TIPS:* If you just want to change part of the original `options` object, *shadow copy* it before changing it, the function should not modify the original data.

## replaceRequestData(req, data)
- **Description:**
  - Triggered before the request is sent out
  - Replace the request data, usually the post body.

- **Arguments:**
  - `{Object} req`
  - `{Buffer} data` *Refer to the Nodejs [Buffer][node_buffer]*

- **Retrurned Promise:**
  - `{Buffer} reqData`

- **Sample:**
  -  [rule_replace_request_data.js](/rule_sample/rule_replace_request_data.js)

## replaceResponseStatusCode(req, res, statusCode)
- **Description:**
  - Triggerd before the response is sent to the original request
  - Replace the responsed satus code.

- **Arguments:**
  - `{Object} req`
  - `{Object} res`
  - `{Number} statusCode`

- **Returned Promise:**
  - `{Number} statusCode`

- **Sample:**
  - [rule_replace_response_status_code.js](/rule_sample/rule_replace_response_status_code.js)

## replaceResponseHeader(req, res, header)

- **Descriptoin:**
  - Triggered before the response is sent to the origin
  - Replace the response header.

- **Arguments:**
  - `{Object} req`
  - `{Object} res`
  - `{Object} header`

- **Returned Promise:**
  - `{Object} header`


- **Sample:**
  - [rule_replace_response_header.js](/rule_sample/rule_replace_response_header.js)

## replaceServerResData(req, res, serverData)

- **Description:**
  - Replace the response data before it's send to original request.

- **Arguments:**
  - `{Object} req`
  - `{Object} res`
  - `{Buffer} serverData`

- **Returned Promise:**
  - `{Buffer} serverData`

- **Sample:**
  - [rule_replace_response_data.js](/rule_sample/rule_replace_response_data.js)


## shouldInterceptHttpsReq(req)

- **Description:**
  - Triggered when we are in https request, before the request sent out.
  - If returned true, AnyProxy will use its self-issued certificate to hack the request. Otherwise, you could not get any further information about this request.
  - Proxy users will get a warning about security if they don't trust the certificates issued by AnyProxy.
  - Default to the initial option when initialize the proxy server with `proxy.porxyServer(option)`

- **Arguments:**
  - `{Object} req`

- **Returned Promise:**
  - `{Bool} shouldIntercept`

- **Sample:**
  - [rule_should_intercept_https_req.js](/rule_sample/rule_should_intercept_https_req.js)


[node_http_options]: https://nodejs.org/api/http.html#http_http_request_options_callback
[node_buffer]: https://nodejs.org/api/buffer.html

