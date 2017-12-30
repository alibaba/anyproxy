'use strict';

const http = require('http'),
  https = require('https'),
  net = require('net'),
  url = require('url'),
  zlib = require('zlib'),
  color = require('colorful'),
  Buffer = require('buffer').Buffer,
  util = require('./util'),
  Stream = require('stream'),
  logUtil = require('./log'),
  co = require('co'),
  HttpsServerMgr = require('./httpsServerMgr'),
  brotliTorb = require('brotli'),
  Readable = require('stream').Readable;

const requestErrorHandler = require('./requestErrorHandler');

// to fix issue with TLS cache, refer to: https://github.com/nodejs/node/issues/8368
https.globalAgent.maxCachedSessions = 0;

const DEFAULT_CHUNK_COLLECT_THRESHOLD = 20 * 1024 * 1024; // about 20 mb

class CommonReadableStream extends Readable {
  constructor(config) {
    super({
      highWaterMark: DEFAULT_CHUNK_COLLECT_THRESHOLD * 5
    });
  }
  _read(size) {

  }
}

/*
* get error response for exception scenarios
*/
const getErrorResponse = (error, fullUrl) => {
  // default error response
  const errorResponse = {
    statusCode: 500,
    header: {
      'Content-Type': 'text/html; charset=utf-8',
      'Proxy-Error': true,
      'Proxy-Error-Message': error || 'null'
    },
    body: requestErrorHandler.getErrorContent(error, fullUrl)
  };

  return errorResponse;
}

/**
 * fetch remote response
 *
 * @param {string} protocol
 * @param {object} options options of http.request
 * @param {buffer} reqData request body
 * @param {object} config
 * @param {boolean} config.dangerouslyIgnoreUnauthorized
 * @param {boolean} config.chunkSizeThreshold
 * @returns
 */
function fetchRemoteResponse(protocol, options, reqData, config) {
  reqData = reqData || '';
  return new Promise((resolve, reject) => {
    delete options.headers['content-length']; // will reset the content-length after rule
    delete options.headers['Content-Length'];
    delete options.headers['Transfer-Encoding'];
    delete options.headers['transfer-encoding'];

    if (config.dangerouslyIgnoreUnauthorized) {
      options.rejectUnauthorized = false;
    }

    if (!config.chunkSizeThreshold) {
      throw new Error('chunkSizeThreshold is required');
    }

    //send request
    const proxyReq = (/https/i.test(protocol) ? https : http).request(options, (res) => {
      res.headers = util.getHeaderFromRawHeaders(res.rawHeaders);
      //deal response header
      const statusCode = res.statusCode;
      const resHeader = res.headers;
      let resDataChunks = []; // array of data chunks or stream
      const rawResChunks = []; // the original response chunks
      let resDataStream = null;
      let resSize = 0;
      const finishCollecting = () => {
        new Promise((fulfill, rejectParsing) => {
          if (resDataStream) {
            fulfill(resDataStream);
          } else {
            const serverResData = Buffer.concat(resDataChunks);
            const originContentLen = util.getByteSize(serverResData);
            // remove gzip related header, and ungzip the content
            // note there are other compression types like deflate
            const contentEncoding = resHeader['content-encoding'] || resHeader['Content-Encoding'];
            const ifServerGzipped = /gzip/i.test(contentEncoding);
            const isServerDeflated = /deflate/i.test(contentEncoding);
            const isBrotlied = /br/i.test(contentEncoding);

            /**
             * when the content is unzipped, update the header content
             */
            const refactContentEncoding = () => {
              if (contentEncoding) {
                resHeader['x-anyproxy-origin-content-encoding'] = contentEncoding;
                delete resHeader['content-encoding'];
                delete resHeader['Content-Encoding'];
              }
            }

            // set origin content length into header
            resHeader['x-anyproxy-origin-content-length'] = originContentLen;
            
            // only do unzip when there is res data
            if (ifServerGzipped && originContentLen) {
              refactContentEncoding();
              zlib.gunzip(serverResData, (err, buff) => { // TODO test case to cover
                if (err) {
                  rejectParsing(err);
                } else {
                  fulfill(buff);
                }
              });
            } else if (isServerDeflated && originContentLen) {
              refactContentEncoding();
              zlib.inflateRaw(serverResData, (err, buff) => { // TODO test case to cover
                if (err) {
                  rejectParsing(err);
                } else {
                  fulfill(buff);
                }
              });
            } else if (isBrotlied && originContentLen) {
              refactContentEncoding();

              try {
                // an Unit8Array returned by decompression
                const result = brotliTorb.decompress(serverResData);
                fulfill(Buffer.from(result));
              } catch (e) {
                rejectParsing(e);
              }
            } else {
              fulfill(serverResData);
            }
          }
        }).then((serverResData) => {
          resolve({
            statusCode,
            header: resHeader,
            body: serverResData,
            rawBody: rawResChunks,
            _res: res,
          });
        }).catch((e) => {
          reject(e);
        });
      };

      //deal response data
      res.on('data', (chunk) => {
        rawResChunks.push(chunk);
        if (resDataStream) { // stream mode
          resDataStream.push(chunk);
        } else { // dataChunks
          resSize += chunk.length;
          resDataChunks.push(chunk);

          // stop collecting, convert to stream mode
          if (resSize >= config.chunkSizeThreshold) {
            resDataStream = new CommonReadableStream();
            while (resDataChunks.length) {
              resDataStream.push(resDataChunks.shift());
            }
            resDataChunks = null;
            finishCollecting();
          }
        }
      });

      res.on('end', () => {
        if (resDataStream) {
          resDataStream.push(null); // indicate the stream is end
        } else {
          finishCollecting();
        }
      });
      res.on('error', (error) => {
        logUtil.printLog('error happend in response:' + error, logUtil.T_ERR);
        reject(error);
      });
    });

    proxyReq.on('error', reject);
    proxyReq.end(reqData);
  });
}

/**
 * get a request handler for http/https server
 *
 * @param {RequestHandler} reqHandlerCtx
 * @param {object} userRule
 * @param {Recorder} recorder
 * @returns
 */
function getUserReqHandler(userRule, recorder) {
  const reqHandlerCtx = this

  return function (req, userRes) {
    /*
    note
      req.url is wired
      in http  server: http://www.example.com/a/b/c
      in https server: /a/b/c
    */

    const host = req.headers.host;
    const protocol = (!!req.connection.encrypted && !(/^http:/).test(req.url)) ? 'https' : 'http';
    const fullUrl = protocol === 'http' ? req.url : (protocol + '://' + host + req.url);

    const urlPattern = url.parse(fullUrl);
    const path = urlPattern.path;
    const chunkSizeThreshold = DEFAULT_CHUNK_COLLECT_THRESHOLD;

    let resourceInfo = null;
    let resourceInfoId = -1;
    let reqData;
    let requestDetail;

    // refer to https://github.com/alibaba/anyproxy/issues/103
    // construct the original headers as the reqheaders
    req.headers = util.getHeaderFromRawHeaders(req.rawHeaders);

    logUtil.printLog(color.green(`received request to: ${req.method} ${host}${path}`));

    /**
     * fetch complete req data
     */
    const fetchReqData = () => new Promise((resolve) => {
      const postData = [];
      req.on('data', (chunk) => {
        postData.push(chunk);
      });
      req.on('end', () => {
        reqData = Buffer.concat(postData);
        resolve();
      });
    });

    /**
     * prepare detailed request info
     */
    const prepareRequestDetail = () => {
      const options = {
        hostname: urlPattern.hostname || req.headers.host,
        port: urlPattern.port || req.port || (/https/.test(protocol) ? 443 : 80),
        path,
        method: req.method,
        headers: req.headers
      };

      requestDetail = {
        requestOptions: options,
        protocol,
        url: fullUrl,
        requestData: reqData,
        _req: req
      };

      return Promise.resolve();
    };

    /**
    * send response to client
    *
    * @param {object} finalResponseData
    * @param {number} finalResponseData.statusCode
    * @param {object} finalResponseData.header
    * @param {buffer|string} finalResponseData.body
    */
    const sendFinalResponse = (finalResponseData) => {
      const responseInfo = finalResponseData.response;
      const resHeader = responseInfo.header;
      const responseBody = responseInfo.body || '';

      const transferEncoding = resHeader['transfer-encoding'] || resHeader['Transfer-Encoding'] || '';
      const contentLength = resHeader['content-length'] || resHeader['Content-Length'];
      const connection = resHeader.Connection || resHeader.connection;
      if (contentLength) {
        delete resHeader['content-length'];
        delete resHeader['Content-Length'];
      }

      // set proxy-connection
      if (connection) {
        resHeader['x-anyproxy-origin-connection'] = connection;
        delete resHeader.connection;
        delete resHeader.Connection;
      }

      if (!responseInfo) {
        throw new Error('failed to get response info');
      } else if (!responseInfo.statusCode) {
        throw new Error('failed to get response status code')
      } else if (!responseInfo.header) {
        throw new Error('filed to get response header');
      }
      // if there is no transfer-encoding, set the content-length
      if (!global._throttle
        && transferEncoding !== 'chunked'
        && !(responseBody instanceof CommonReadableStream)
        ) {
        resHeader['Content-Length'] = util.getByteSize(responseBody);
      }

      userRes.writeHead(responseInfo.statusCode, resHeader);

      if (global._throttle) {
        if (responseBody instanceof CommonReadableStream) {
          responseBody.pipe(global._throttle.throttle()).pipe(userRes);
        } else {
          const thrStream = new Stream();
          thrStream.pipe(global._throttle.throttle()).pipe(userRes);
          thrStream.emit('data', responseBody);
          thrStream.emit('end');
        }
      } else {
        if (responseBody instanceof CommonReadableStream) {
          responseBody.pipe(userRes);
        } else {
          userRes.end(responseBody);
        }
      }

      return responseInfo;
    }

    // fetch complete request data
    co(fetchReqData)
      .then(prepareRequestDetail)

      .then(() => {
        // record request info
        if (recorder) {
          resourceInfo = {
            host,
            method: req.method,
            path,
            protocol,
            url: protocol + '://' + host + path,
            req,
            startTime: new Date().getTime()
          };
          resourceInfoId = recorder.appendRecord(resourceInfo);
        }

        try {
          resourceInfo.reqBody = reqData.toString(); //TODO: deal reqBody in webInterface.js
          recorder && recorder.updateRecord(resourceInfoId, resourceInfo);
        } catch (e) { }
      })

      // invoke rule before sending request
      .then(co.wrap(function *() {
        const userModifiedInfo = (yield userRule.beforeSendRequest(Object.assign({}, requestDetail))) || {};
        const finalReqDetail = {};
        ['protocol', 'requestOptions', 'requestData', 'response'].map((key) => {
          finalReqDetail[key] = userModifiedInfo[key] || requestDetail[key]
        });
        return finalReqDetail;
      }))

      // route user config
      .then(co.wrap(function *(userConfig) {
        if (userConfig.response) {
          // user-assigned local response
          userConfig._directlyPassToRespond = true;
          return userConfig;
        } else if (userConfig.requestOptions) {
          const remoteResponse = yield fetchRemoteResponse(userConfig.protocol, userConfig.requestOptions, userConfig.requestData, {
            dangerouslyIgnoreUnauthorized: reqHandlerCtx.dangerouslyIgnoreUnauthorized,
            chunkSizeThreshold,
          });
          return {
            response: {
              statusCode: remoteResponse.statusCode,
              header: remoteResponse.header,
              body: remoteResponse.body,
              rawBody: remoteResponse.rawBody
            },
            _res: remoteResponse._res,
          };
        } else {
          throw new Error('lost response or requestOptions, failed to continue');
        }
      }))

      // invoke rule before responding to client
      .then(co.wrap(function *(responseData) {
        if (responseData._directlyPassToRespond) {
          return responseData;
        } else if (responseData.response.body && responseData.response.body instanceof CommonReadableStream) { // in stream mode
          return responseData;
        } else {
          // TODO: err etimeout
          return (yield userRule.beforeSendResponse(Object.assign({}, requestDetail), Object.assign({}, responseData))) || responseData;
        }
      }))

      .catch(co.wrap(function *(error) {
        logUtil.printLog(util.collectErrorLog(error), logUtil.T_ERR);

        let errorResponse = getErrorResponse(error, fullUrl);

        // call user rule
        try {
          const userResponse = yield userRule.onError(Object.assign({}, requestDetail), error);
          if (userResponse && userResponse.response && userResponse.response.header) {
            errorResponse = userResponse.response;
          }
        } catch (e) {}

        return {
          response: errorResponse
        };
      }))
      .then(sendFinalResponse)

      //update record info
      .then((responseInfo) => {
        resourceInfo.endTime = new Date().getTime();
        resourceInfo.res = { //construct a self-defined res object
          statusCode: responseInfo.statusCode,
          headers: responseInfo.header,
        };

        resourceInfo.statusCode = responseInfo.statusCode;
        resourceInfo.resHeader = responseInfo.header;
        resourceInfo.resBody = responseInfo.body instanceof CommonReadableStream ? '(big stream)' : (responseInfo.body || '');
        resourceInfo.length = resourceInfo.resBody.length;

        // console.info('===> resbody in record', resourceInfo);

        recorder && recorder.updateRecord(resourceInfoId, resourceInfo);
      })
      .catch((e) => {
        logUtil.printLog(color.green('Send final response failed:' + e.message), logUtil.T_ERR);
      });
  }
}

/**
 * get a handler for CONNECT request
 *
 * @param {RequestHandler} reqHandlerCtx
 * @param {object} userRule
 * @param {Recorder} recorder
 * @param {object} httpsServerMgr
 * @returns
 */
function getConnectReqHandler(userRule, recorder, httpsServerMgr) {
  const reqHandlerCtx = this; reqHandlerCtx.conns = new Map(); reqHandlerCtx.cltSockets = new Map()

  return function (req, cltSocket, head) {
    const host = req.url.split(':')[0],
      targetPort = req.url.split(':')[1];
    let shouldIntercept;
    let requestDetail;
    let resourceInfo = null;
    let resourceInfoId = -1;

    const requestStream = new CommonReadableStream();

    /*
      1. write HTTP/1.1 200 to client
      2. get request data
      3. tell if it is a websocket request
      4.1 if (websocket || do_not_intercept) --> pipe to target server
      4.2 else --> pipe to local server and do man-in-the-middle attack
    */
    co(function *() {
      // determine whether to use the man-in-the-middle server
      logUtil.printLog(color.green('received https CONNECT request ' + host));
      if (reqHandlerCtx.forceProxyHttps) {
        shouldIntercept = true;
      } else {
        requestDetail = {
          host: req.url,
          _req: req
        };
        shouldIntercept = yield userRule.beforeDealHttpsRequest(requestDetail);
      }
    })
    .then(() =>
      new Promise((resolve) => {
        // mark socket connection as established, to detect the request protocol
        cltSocket.write('HTTP/' + req.httpVersion + ' 200 OK\r\n\r\n', 'UTF-8', resolve);
      })
    )
    .then(() =>
      new Promise((resolve, reject) => {
        let resolved = false;
        cltSocket.on('data', (chunk) => {
          requestStream.push(chunk);
          if (!resolved) {
            resolved = true;
            try {
              const chunkString = chunk.toString();
              if (chunkString.indexOf('GET ') === 0) {
                shouldIntercept = false; //websocket
              }
            } catch (e) {
              console.error(e);
            }
            resolve();
          }
        });
        cltSocket.on('end', () => {
          requestStream.push(null);
        });
      })
    )
    .then((result) => {
      // log and recorder
      if (shouldIntercept) {
        logUtil.printLog('will forward to local https server');
      } else {
        logUtil.printLog('will bypass the man-in-the-middle proxy');
      }

      //record
      if (recorder) {
        resourceInfo = {
          host,
          method: req.method,
          path: '',
          url: 'https://' + host,
          req,
          startTime: new Date().getTime()
        };
        resourceInfoId = recorder.appendRecord(resourceInfo);
      }
    })
    .then(() => {
      // determine the request target
      if (!shouldIntercept) {
        return {
          host,
          port: (targetPort === 80) ? 443 : targetPort,
        }
      } else {
        return httpsServerMgr.getSharedHttpsServer(host).then(serverInfo => ({ host: serverInfo.host, port: serverInfo.port }));
      }
    })
    .then((serverInfo) => {
      if (!serverInfo.port || !serverInfo.host) {
        throw new Error('failed to get https server info');
      }

      return new Promise((resolve, reject) => {
        const conn = net.connect(serverInfo.port, serverInfo.host, () => {
          //throttle for direct-foward https
          if (global._throttle && !shouldIntercept) {
            requestStream.pipe(conn);
            conn.pipe(global._throttle.throttle()).pipe(cltSocket);
          } else {
            requestStream.pipe(conn);
            conn.pipe(cltSocket);
          }

          resolve();
        });

        conn.on('error', (e) => {
          reject(e);
        });

        reqHandlerCtx.conns.set(serverInfo.host + ':' + serverInfo.port, conn)
        reqHandlerCtx.cltSockets.set(serverInfo.host + ':' + serverInfo.port, cltSocket)
      });
    })
    .then(() => {
      if (recorder) {
        resourceInfo.endTime = new Date().getTime();
        resourceInfo.statusCode = '200';
        resourceInfo.resHeader = {};
        resourceInfo.resBody = '';
        resourceInfo.length = 0;

        recorder && recorder.updateRecord(resourceInfoId, resourceInfo);
      }
    })
    .catch(co.wrap(function *(error) {
      logUtil.printLog(util.collectErrorLog(error), logUtil.T_ERR);

      try {
        yield userRule.onConnectError(requestDetail, error);
      } catch (e) { }

      try {
        let errorHeader = 'Proxy-Error: true\r\n';
        errorHeader += 'Proxy-Error-Message: ' + (error || 'null') + '\r\n';
        errorHeader += 'Content-Type: text/html\r\n';
        cltSocket.write('HTTP/1.1 502\r\n' + errorHeader + '\r\n\r\n');
      } catch (e) { }
    }));
  }
}

class RequestHandler {

  /**
   * Creates an instance of RequestHandler.
   *
   * @param {object} config
   * @param {boolean} config.forceProxyHttps proxy all https requests
   * @param {boolean} config.dangerouslyIgnoreUnauthorized
   * @param {object} rule
   * @param {Recorder} recorder
   *
   * @memberOf RequestHandler
   */
  constructor(config, rule, recorder) {
    const reqHandlerCtx = this;
    if (config.forceProxyHttps) {
      this.forceProxyHttps = true;
    }
    if (config.dangerouslyIgnoreUnauthorized) {
      this.dangerouslyIgnoreUnauthorized = true;
    }
    const default_rule = util.freshRequire('./rule_default');
    const userRule = util.merge(default_rule, rule);

    reqHandlerCtx.userRequestHandler = getUserReqHandler.apply(reqHandlerCtx, [userRule, recorder]);

    reqHandlerCtx.httpsServerMgr = new HttpsServerMgr({
      handler: reqHandlerCtx.userRequestHandler
    });

    this.connectReqHandler = getConnectReqHandler.apply(reqHandlerCtx, [userRule, recorder, reqHandlerCtx.httpsServerMgr])
  }
}

module.exports = RequestHandler;
