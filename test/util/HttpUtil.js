/* eslint prefer-arrow-callback: 0 */
/**
 * An util to make the request out
 *
 */
const request = require('request');
const fs = require('fs');
const WebSocket = require('ws');
const HttpsProxyAgent = require('https-proxy-agent');
const stream = require('stream');

const PROXY_HOST = 'http://localhost:8001';
const SOCKET_PROXY_HOST = 'http://localhost:8001';


const HTTP_SERVER_BASE = 'http://localhost:3000';
const HTTPS_SERVER_BASE = 'https://localhost:3001';
const WS_SERVER_BASE = 'ws://localhost:3000';
const WSS_SERVER_BASE = 'wss://localhost:3001';
const DEFAULT_CHUNK_COLLECT_THRESHOLD = 20 * 1024 * 1024; // about 20 mb

class commonStream extends stream.Readable {
  constructor(config) {
    super({
      highWaterMark: DEFAULT_CHUNK_COLLECT_THRESHOLD * 5
    });
  }
  _read(size) {}
}

function getHostFromUrl(url = '') {
  const hostReg = /^(https{0,1}:\/\/)(\w+)/;
  const match = url.match(hostReg);

  return match && match[2] ? match[2] : '';
}

function getPortFromUrl(url = '') {
  const portReg = /^https{0,1}:\/\/\w+(:(\d+)){0,1}/;
  const match = url.match(portReg);
  let port = match && match[2] ? match[2] : '';

  if (!port) {
    port = url.indexOf('https://') === 0 ? 443 : 80;
  }
  return port;
}

/**
 * 获取url中的path
 */
function getPathFromUrl(url = '') {
  const pathReg = /^https{0,1}:\/\/\w+(:\d+){0,1}(.+)/;
  const match = url.match(pathReg);
  const path = match && match[3] ? match[2] : url;
  return path;
}

function proxyRequest(method = 'GET', url, params, headers = {}) {
  return doRequest(method, url, params, headers, true);
}

/*
 * 直接请求到真实服务器，不经过代理服务器
 *
 */
function directRequest(method = 'GET', url, params, headers = {}) {
  return doRequest(method, url, params, headers);
}

function directUpload(url, filepath, formParams = {}, headers = {}) {
  return doUpload(url, 'POST', filepath, formParams, headers);
}

function proxyUpload(url, filepath, formParams = {}, headers = {}) {
  return doUpload(url, 'POST', filepath, formParams, headers, true);
}

function directPutUpload(url, filepath, formParams = {}, headers = {}) {
  return doUpload(url, 'PUT', filepath, formParams, headers);
}

function proxyPutUpload(url, filepath, headers = {}) {
  return doUpload(url, 'PUT', filepath, headers, true);
}

/**
 * @param  params {String}  json类型或file路径
 *                {Object}  key-value形式
 */
function doRequest(method = 'GET', url, params, headers = {}, isProxy) {
  headers = Object.assign({}, headers);

  let reqStream = new commonStream();
  const requestData = {
    headers,
    followRedirect: false,
    rejectUnauthorized: false
  };

  if (isProxy) {
    requestData.proxy = PROXY_HOST;
    requestData.headers['via-proxy'] = 'true';
  }

  const streamReq = (resolve, reject) => {
    requestData.headers['content-type'] = 'text/plain'; //otherwise, koa-body could not recognize
    if (typeof params === 'string') {
      fs.existsSync(params) ?
        reqStream = fs.createReadStream(params) :
        reqStream.push(params);
    } else if (typeof params === 'object') {
      reqStream.push(JSON.stringify(params));
    }
    reqStream.push(null);
    reqStream.pipe(request[method.toLowerCase()](
      url,
      requestData,
      (error, response, body) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      }
    ))
  }
  const commonReq = (resolve, reject) => {
    requestData.url = url;
    requestData.method = method;
    requestData.qs = params;
    request(
      requestData,
      (error, response, body) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      }
    );
  }
  const requestTask = new Promise((resolve, reject) => {
    if (method === 'POST' || method === 'PUT') {
      streamReq(resolve, reject);
    } else {
      commonReq(resolve, reject);
    }
  });
  return requestTask;
}


function doUpload(url, method, filepath, formParams, headers = {}, isProxy) {
  let formData = {
    file: fs.createReadStream(filepath)
  };

  formData = Object.assign({}, formData, formParams);
  headers = Object.assign({}, headers);

  const requestData = {
    formData,
    url,
    method,
    headers,
    json: true,
    rejectUnauthorized: false
  };

  if (isProxy) {
    requestData.proxy = PROXY_HOST;
    requestData.headers['via-proxy'] = 'true';
  }
  const requestTask = new Promise((resolve, reject) => {
    request(
      requestData,
      (error, response, body) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(response);
      }
    );
  });
  return requestTask;
}

function doWebSocket(url, headers = {}, isProxy) {
  let ws;
  if (isProxy) {
    headers['via-proxy'] = 'true';
    const agent = new HttpsProxyAgent(SOCKET_PROXY_HOST);
    ws = new WebSocket(url, {
      agent,
      rejectUnauthorized: false,
      headers
    });
  } else {
    ws = new WebSocket(url, {
      rejectUnauthorized: false,
      headers
    });
  }

  return ws;
}

function proxyGet(url, params, headers = {}) {
  return proxyRequest('GET', url, params, headers);
}

function proxyPost(url, params, headers = {}) {
  return proxyRequest('POST', url, params, headers);
}

function proxyPut(url, params, headers = {}) {
  return proxyRequest('PUT', url, params, headers);
}

function proxyDelete(url, params, headers = {}) {
  return proxyRequest('DELETE', url, params, headers);
}

function proxyHead(url, headers = {}) {
  return proxyRequest('HEAD', url, {}, headers);
}

function proxyOptions(url, headers = {}) {
  return proxyRequest('OPTIONS', url, {}, headers);
}

function directGet(url, params, headers = {}) {
  return directRequest('GET', url, params, headers);
}

function directPost(url, params, headers = {}) {
  return directRequest('POST', url, params, headers);
}

function directPut(url, params, headers = {}) {
  return directRequest('PUT', url, params, headers);
}

function directDelete(url, params, headers = {}) {
  return directRequest('DELETE', url, params, headers);
}

function directHead(url, headers = {}) {
  return directRequest('HEAD', url, {}, headers);
}

function directOptions(url, headers = {}) {
  return directRequest('OPTIONS', url, {}, headers);
}

function proxyWs(url, headers) {
  return doWebSocket(url, headers, true);
}

function directWs(url, headers) {
  return doWebSocket(url, headers);
}

/**
* generate the final url based on protocol and path
*
*/
function generateUrl(protocol, urlPath) {
  return protocol === 'http' ? HTTP_SERVER_BASE + urlPath : HTTPS_SERVER_BASE + urlPath;
}

function generateWsUrl(protocol, urlPath) {
  return protocol === 'wss' ? WSS_SERVER_BASE + urlPath : WS_SERVER_BASE + urlPath;
}

/*
* verify if the request data is a valid proxy request, by checking specified header
*/
function isViaProxy(req) {
  return req.headers['via-proxy'] === 'true';
}

/*
* check if url is supported by request moudle
*/
function isSupportedProtocol(requestPath) {
  return requestPath.indexOf('http://') === 0 || requestPath.indexOf('https://') === 0;
}

/*
* collect all request data in one url
*/
function getRequestListFromPage(pageUrl, cb) {
  let _ph;
  let _page;
  let _outObj;
  const phantom = require('phantom');
  console.log(`collecting requests from ${pageUrl}...`);
  return phantom.create().then(ph => {
    _ph = ph;
    return _ph.createPage();
  }).then(page => {
    _page = page;
    _outObj = _ph.createOutObject();
    _outObj.urls = [];
    page.property('onResourceRequested', function (requestData, networkRequest, out) {
      out.urls.push(requestData);
    }, _outObj);
    return _page.open(pageUrl);
  })
  .then(status => _outObj.property('urls'))
  .then(urls => {
    _page.close();
    _ph.exit();
    return urls;
  })
  .catch((err) => {
    console.log(`failed to collecting requests from ${pageUrl}`);
    console.log(err);
  });
}


module.exports = {
  getHostFromUrl,
  getPathFromUrl,
  getPortFromUrl,
  proxyGet,
  proxyPost,
  directGet,
  directPost,
  directUpload,
  proxyUpload,
  generateUrl,
  proxyWs,
  directWs,
  generateWsUrl,
  directPut,
  proxyPut,
  directDelete,
  proxyDelete,
  directHead,
  proxyHead,
  directOptions,
  proxyOptions,
  directPutUpload,
  proxyPutUpload,
  isViaProxy,
  getRequestListFromPage,
  directRequest,
  proxyRequest,
  isSupportedProtocol
};
