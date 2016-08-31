/**
 * An util to make the request out
 *
 */
const querystring = require('querystring');
const http = require('http');
const zlib = require('zlib');
const Buffer = require('buffer').Buffer;
const request = require('request');
const fs = require('fs');
const WebSocket = require('ws');
const HttpsProxyAgent = require('https-proxy-agent');

const DEFAULT_HOST = 'localhost';
const PROXY_HOST = 'http://localhost:8001';
const SOCKET_PROXY_HOST = 'http://localhost:8001';


const HTTP_SERVER_BASE = 'http://localhost:3000';
const HTTPS_SERVER_BASE = 'https://localhost:3001';
const WS_SERVER_BASE = 'ws://localhost:3000';
const WSS_SERVER_BASE = 'wss://localhost:3001';

const DEFAULT_PROXY_OPTIONS = {
    port: 8001, // proxy的端口
    method: 'GET',
    host: 'localhost'
};

const DEFAULT_OPTIONS = {

};

function getHostFromUrl (url = '') {
    const hostReg = /^(https{0,1}:\/\/)(\w+)/;
    const match = url.match(hostReg);

    return match && match[2] ? match[2] : '';
}

function getPortFromUrl (url = '') {
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
function getPathFromUrl (url = '') {
    const pathReg = /^https{0,1}:\/\/\w+(:\d+){0,1}(.+)/;
    const match = url.match(pathReg);
    const path = match && match[3] ? match[2] : url;
    return path;
}

function proxyRequest (method = 'GET', url, params, headers = {}) {
    return doRequest(method, url, params, headers, true);
}

/*
 * 直接请求到真实服务器，不经过代理服务器
 *
 */
function directRequest (method = 'GET', url, params, headers = {}) {
    return doRequest(method, url, params, headers);
}

function directUpload (url, filepath, formParams = {}, headers = {}) {
    return doUpload(url, 'POST', filepath, formParams, headers);
}

function proxyUpload (url, filepath, formParams = {}, headers = {}) {
    return doUpload(url, 'POST', filepath, formParams, headers, true);
}

function directPutUpload (url, filepath, formParams = {}, headers = {}) {
    return doUpload(url, 'PUT', filepath, formParams, headers);
}

function proxyPutUpload (url, filepath, headers = {}) {
    return doUpload(url, 'PUT', filepath, headers, true);
}

function doRequest (method = 'GET', url, params, headers = {}, isProxy) {
    headers = Object.assign({}, headers);
    const requestData = {
        method: method,
        form: params,
        url: url,
        headers: headers,
        rejectUnauthorized: false
    };

    if (isProxy) {
        requestData.proxy = PROXY_HOST;
        requestData.headers['via-proxy'] = 'true';
    }

    const requestTask = new Promise((resolve, reject) => {
        request(
            requestData,
            function (error, response, body) {
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

function doUpload (url, method, filepath, formParams, headers = {}, isProxy) {
    let formData = {
        file: fs.createReadStream(filepath)
    };

    formData = Object.assign({}, formData, formParams);
    headers = Object.assign({}, headers);

    const requestData = {
        formData: formData,
        url: url,
        method: method,
        headers: headers,
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
            function (error, response, body) {
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

function doWebSocket(url, isProxy) {
    let ws;
    if (isProxy) {
        const agent = new HttpsProxyAgent(SOCKET_PROXY_HOST);
        ws = new WebSocket(url, {
            agent: agent,
            rejectUnauthorized: false
        });
    } else {
        ws = new WebSocket(url, {
            rejectUnauthorized: false
        });
    }

    return ws;
}

function proxyGet (url, params, headers = {}) {
    return proxyRequest('GET', url, params, headers);
}

function proxyPost (url, params, headers = {}) {
    return proxyRequest('POST', url, params, headers);
}

function proxyPut (url, params, headers = {}) {
    return proxyRequest('PUT', url, params, headers);
}

function proxyDelete (url, params, headers = {}) {
    return proxyRequest('DELETE', url, params, headers);
}

function proxyHead(url, headers = {}) {
    return proxyRequest('HEAD', url, {}, headers);
}

function proxyOptions(url, headers = {}) {
    return proxyRequest('OPTIONS', url, {}, headers);
}

function directGet (url, params, headers = {}) {
    return directRequest('GET', url, params, headers);
}

function directPost (url, params, headers = {}) {
    return directRequest('POST', url, params, headers);
}

function directPut (url, params, headers = {}) {
    return directRequest('PUT', url, params, headers);
}

function directDelete (url, params, headers = {}) {
    return directRequest('DELETE', url, params, headers);
}

function directHead (url, headers = {}) {
    return directRequest('HEAD', url, {} , headers);
}

function directOptions (url, headers ={}) {
    return directRequest('OPTIONS', url,  {}, headers);
}

function proxyWs (url) {
    return doWebSocket(url, true);
}

function directWs (url) {
    return doWebSocket(url);
}

/**
* generate the final url based on protocol and path
*
*/
function generateUrl (protocol, urlPath) {
    return protocol === 'http' ? HTTP_SERVER_BASE + urlPath : HTTPS_SERVER_BASE + urlPath;
}

function generateWsUrl (protocol, urlPath) {
    return protocol === 'wss' ? WSS_SERVER_BASE + urlPath : WS_SERVER_BASE + urlPath;
}

module.exports = {
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
    proxyPutUpload
};