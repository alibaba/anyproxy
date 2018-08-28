/// <reference path="../../typings/index.d.ts" />

declare interface IErrorResponse {
  statusCode: number;
  header: OneLevelObjectType;
  body: string;
}

import * as url from 'url';
import * as https from 'https';
import * as http from 'http';
import * as color from 'colorful';
import * as buffer from 'buffer';
import * as Stream from 'stream';
import * as zlib from 'zlib';
import * as brotliTorb from 'brotli';
import * as co from 'co';
import util from '../util';
import logUtil from '../log';
import RequestErrorHandler from './requestErrorHandler';
import CommonReadableStream from './CommonReadableStream';
import Recorder from '../recorder';
const Buffer = buffer.Buffer;
// const
//   url = require('url'),
//   https = require('https'),
//   http = require('http'),
//   color = require('colorful'),
//   Buffer = require('buffer').Buffer,
//   util = require('../util').default,
//   Stream = require('stream'),
//   logUtil = require('../log'),
//   CommonReadableStream = require('./CommonReadableStream'),
//   zlib = require('zlib'),
//   brotliTorb = require('brotli'),
//   co = require('co');

const requestErrorHandler = new RequestErrorHandler();
const DEFAULT_CHUNK_COLLECT_THRESHOLD = 20 * 1024 * 1024; // about 20 mb

// to fix issue with TLS cache, refer to: https://github.com/nodejs/node/issues/8368
(https.globalAgent as any).maxCachedSessions = 0;

/**
 * fetch remote response
 *
 * @param {string} protocol
 * @param {object} options
 * @param {buffer} reqData
 * @param {object} config
 * @param {boolean} config.dangerouslyIgnoreUnauthorized
 * @param {boolean} config.chunkSizeThreshold
 * @returns
 */
function fetchRemoteResponse(
  protocol: string, options: https.RequestOptions | http.RequestOptions ,
  reqData: Buffer, config: {
    dangerouslyIgnoreUnauthorized: boolean;
    chunkSizeThreshold: number;
  }): Promise<any> {
  reqData = reqData || Buffer.from('');
  return new Promise((resolve, reject) => {
    delete options.headers['content-length']; // will reset the content-length after rule
    delete options.headers['Content-Length'];
    delete options.headers['Transfer-Encoding'];
    delete options.headers['transfer-encoding'];

    if (config.dangerouslyIgnoreUnauthorized) {
      (options as https.RequestOptions).rejectUnauthorized = false;
    }

    if (!config.chunkSizeThreshold) {
      throw new Error('chunkSizeThreshold is required');
    }

    const finalHttpModule: typeof https | typeof http = /https/i.test(protocol) ? https : http;
    // send request
    const proxyReq: http.ClientRequest = (finalHttpModule as any).request(options, (res: http.IncomingMessage): void => {
      res.headers = util.getHeaderFromRawHeaders(res.rawHeaders);
      // deal response header
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
            const ifServerGzipped = /gzip/i.test((contentEncoding as string));
            const isServerDeflated = /deflate/i.test((contentEncoding as string));
            const isBrotlied = /br/i.test((contentEncoding as string));

            /**
             * when the content is unzipped, update the header content
             */
            const refactContentEncoding = () => {
              if (contentEncoding) {
                resHeader['x-anyproxy-origin-content-encoding'] = contentEncoding;
                delete resHeader['content-encoding'];
                delete resHeader['Content-Encoding'];
              }
            };

            // set origin content length into header
            resHeader['x-anyproxy-origin-content-length'] = '' + originContentLen;

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

      // deal response data
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


/*
* get error response for exception scenarios
*/
function getErrorResponse(error: NodeJS.ErrnoException, fullUrl: string): IErrorResponse {
  // default error response
  const errorResponse = {
    statusCode: 500,
    header: {
      'Content-Type': 'text/html; charset=utf-8',
      'Proxy-Error': true,
      'Proxy-Error-Message': error ? JSON.stringify(error) : 'null',
    },
    body: requestErrorHandler.getErrorContent(error, fullUrl),
  };

  return errorResponse;
}


export default class UserReqHandler {
  public userRule: AnyProxyRule;
  public recorder: Recorder;
  private reqHandlerCtx: any;
  constructor(ctx: any, userRule: AnyProxyRule, recorder: Recorder) {
    this.userRule = userRule;
    this.recorder = recorder;
    this.reqHandlerCtx = ctx;
  }

  public handler(req: http.IncomingMessage, userRes: http.ServerResponse): void {
    /*
    note
      req.url is wired
      in http  server: http://www.example.com/a/b/c
      in https server: /a/b/c
    */
    const self = this;
    const host = req.headers.host;
    const protocol = (!!(req.connection as any).encrypted && !(/^http:/).test(req.url)) ? 'https' : 'http';
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
        port: urlPattern.port || (req as any).port || (/https/.test(protocol) ? 443 : 80),
        path,
        method: req.method,
        headers: req.headers,
      };

      requestDetail = {
        requestOptions: options,
        protocol,
        url: fullUrl,
        requestData: reqData,
        _req: req,
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
        throw new Error('failed to get response status code');
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
    };

    // fetch complete request data
    co(fetchReqData)
      .then(prepareRequestDetail)

      .then(() => {
        // record request info
        if (self.recorder) {
          resourceInfo = {
            host,
            method: req.method,
            path,
            protocol,
            url: protocol + '://' + host + path,
            req,
            startTime: new Date().getTime(),
          };
          resourceInfoId = self.recorder.appendRecord(resourceInfo);
        }

        try {
          resourceInfo.reqBody = reqData.toString(); // TODO: deal reqBody in webInterface.js
          self.recorder && self.recorder.updateRecord(resourceInfoId, resourceInfo);
        } catch (e) { console.error(e); }
      })

      // invoke rule before sending request
      .then(co.wrap(function*(): Generator {
        const userModifiedInfo = (yield self.userRule.beforeSendRequest(Object.assign({}, requestDetail))) || {};
        const finalReqDetail = {};
        ['protocol', 'requestOptions', 'requestData', 'response'].map((key) => {
          finalReqDetail[key] = userModifiedInfo[key] || requestDetail[key];
        });
        return finalReqDetail;
      }))

      // route user config
      .then(co.wrap(function *(userConfig: AnyProxyRequestDetail): Generator {
        if (userConfig.response) {
          // user-assigned local response
          userConfig._directlyPassToRespond = true;
          return userConfig;
        } else if (userConfig.requestOptions) {
          const remoteResponse = yield fetchRemoteResponse(userConfig.protocol, userConfig.requestOptions, userConfig.requestData, {
            dangerouslyIgnoreUnauthorized: self.reqHandlerCtx.dangerouslyIgnoreUnauthorized,
            chunkSizeThreshold,
          });
          return {
            response: {
              statusCode: remoteResponse.statusCode,
              header: remoteResponse.header,
              body: remoteResponse.body,
              rawBody: remoteResponse.rawBody,
            },
            _res: remoteResponse._res,
          };
        } else {
          throw new Error('lost response or requestOptions, failed to continue');
        }
      }))

      // invoke rule before responding to client
      .then(co.wrap(function*(responseData: AnyProxyReponseDetail): Generator {
        if (responseData._directlyPassToRespond) {
          return responseData;
        } else if (responseData.response.body && responseData.response.body instanceof CommonReadableStream) { // in stream mode
          return responseData;
        } else {
          // TODO: err etimeout
          return (yield self.userRule.beforeSendResponse(
            Object.assign({}, requestDetail), Object.assign({}, responseData))) || responseData;
        }
      }))

      .catch(co.wrap(function *(error: NodeJS.ErrnoException): Generator {
        logUtil.printLog(util.collectErrorLog(error), logUtil.T_ERR);

        let errorResponse = getErrorResponse(error, fullUrl);

        // call user rule
        try {
          const userResponse = yield self.userRule.onError(Object.assign({}, requestDetail), error);
          if (userResponse && userResponse.response && userResponse.response.header) {
            errorResponse = userResponse.response;
          }
        } catch (e) { console.error(e); }

        return {
          response: errorResponse,
        };
      }))
      .then(sendFinalResponse)

      // update record info
      .then((responseInfo) => {
        resourceInfo.endTime = new Date().getTime();
        resourceInfo.res = { // construct a self-defined res object
          statusCode: responseInfo.statusCode,
          headers: responseInfo.header,
        };

        resourceInfo.statusCode = responseInfo.statusCode;
        resourceInfo.resHeader = responseInfo.header;
        resourceInfo.resBody = responseInfo.body instanceof CommonReadableStream ? '(big stream)' : (responseInfo.body || '');
        resourceInfo.length = resourceInfo.resBody.length;

        // console.info('===> resbody in record', resourceInfo);

        self.recorder && self.recorder.updateRecord(resourceInfoId, resourceInfo);
      })
      .catch((e) => {
        logUtil.printLog(color.green('Send final response failed:' + e.message), logUtil.T_ERR);
      });
  }
}
