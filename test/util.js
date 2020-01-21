const request = require('request');
const assert = require('assert');
// TODO
const { freshRequire, getFreePort } = require('../lib/util.js');

function basicProxyRequest(proxyHost, method, url, headers, qs, payload) {
  assert(method && url, 'method and url are required');
  assert(proxyHost, 'proxyHost is required');
  headers = Object.assign({
    'via-anyproxy': 'true',
  }, headers || {});

  const requestOpt = {
    method,
    url,
    headers,
    followRedirect: false,
    rejectUnauthorized: false,
    qs,
    proxy: proxyHost,
  };

  return new Promise((resolve, reject) => {
    const callback = (error, response, body) => {
      if (error) {
        reject(error);
      } else {
        resolve({
          response,
          body,
        });
      }
    };
    if (payload) {
      payload.pipe(request(requestOpt, callback));
    } else {
      request(requestOpt, callback);
    }
  });
}

const DEFAULT_OPTIONS = {
  type: 'http',
  port: 8001,
  webInterface: false,
  wsIntercept: true,
  // throttle: 10000, // optional, speed limit in kb/s
  forceProxyHttps: true, // intercept https as well
  dangerouslyIgnoreUnauthorized: true,
  silent: false //optional, do not print anything into terminal. do not set it when you are still debugging.
};

async function proxyServerWithRule(rule, overrideConfig) {
  const AnyProxy = freshRequire('../proxy.js');
  const freeportA = await getFreePort();
  const freeportB = await getFreePort();
  const options = Object.assign(DEFAULT_OPTIONS, {
    port: freeportA,
    webInterface: {
      enable: true,
      webPort: freeportB,
    }
  }, overrideConfig || {});
  options.rule = rule;

  
  return new Promise((resolve, reject) => {
    const instance = new AnyProxy.ProxyServer(options);
    instance.on('error', reject);
    instance.on('ready', () => {
      resolve(instance);
    });  
    instance.start();
  });
}

module.exports = {
  basicProxyRequest,
  proxyServerWithRule,
};
