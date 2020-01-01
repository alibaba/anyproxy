'use strict';

const co = require('co');
const WebSocket = require('ws');
const logUtil = require('../log');

/**
 * construct the request headers based on original connection,
 * but delete the `sec-websocket-*` headers as they are already consumed by AnyProxy
 */
function getNoWsHeaders(headers) {
  const originHeaders = Object.assign({}, headers);

  Object.keys(originHeaders).forEach((key) => {
    // if the key matchs 'sec-websocket', delete it
    if (/sec-websocket/ig.test(key)) {
      delete originHeaders[key];
    }
  });

  delete originHeaders.connection;
  delete originHeaders.upgrade;
  return originHeaders;
}

/**
 * get request info from the ws client
 * @param @required wsClient the ws client of WebSocket
 */
function getWsReqInfo(wsReq) {
  const headers = wsReq.headers || {};
  const host = headers.host;
  const hostname = host.split(':')[0];
  const port = host.split(':')[1];
  // TODO 如果是windows机器，url是不是全路径？需要对其过滤，取出
  const path = wsReq.url || '/';
  const isEncript = wsReq.connection && wsReq.connection.encrypted;

  return {
    url: `${isEncript ? 'wss' : 'ws'}://${hostname}:${port}${path}`,
    headers: headers, // the full headers of origin ws connection
    noWsHeaders: getNoWsHeaders(headers),
    secure: Boolean(isEncript),
    hostname: hostname,
    port: port,
    path: path
  };
}

/**
 * When the source ws is closed, we need to close the target websocket.
 * If the source ws is normally closed, that is, the code is reserved, we need to transfrom them
 * @param {object} event CloseEvent
 */
const getCloseFromOriginEvent = (closeEvent) => {
  const code = closeEvent.code || '';
  const reason = closeEvent.reason || '';
  let targetCode = '';
  let targetReason = '';
  if (code >= 1004 && code <= 1006) {
    targetCode = 1000; // normal closure
    targetReason = `Normally closed. The origin ws is closed at code: ${code} and reason: ${reason}`;
  } else {
    targetCode = code;
    targetReason = reason;
  }

  return {
    code: targetCode,
    reason: targetReason
  };
}

/**
 * get a websocket event handler
 * @param @required {object} wsClient
 */
function handleWs(userRule, recorder, wsClient, wsReq) {
  const self = this;
  let resourceInfoId = -1;
  const resourceInfo = {
    wsMessages: [] // all ws messages go through AnyProxy
  };
  const clientMsgQueue = [];
  const serverInfo = getWsReqInfo(wsReq);
  // proxy-layer websocket client
  const proxyWs = new WebSocket(serverInfo.url, '', {
    rejectUnauthorized: !self.dangerouslyIgnoreUnauthorized,
    headers: serverInfo.noWsHeaders
  });

  if (recorder) {
    Object.assign(resourceInfo, {
      host: serverInfo.hostname,
      method: 'WebSocket',
      path: serverInfo.path,
      url: serverInfo.url,
      req: wsReq,
      startTime: new Date().getTime()
    });
    resourceInfoId = recorder.appendRecord(resourceInfo);
  }

  /**
   * store the messages before the proxy ws is ready
   */
  const sendProxyMessage = (finalMsg) => {
    const message = finalMsg.data;
    if (proxyWs.readyState === 1) {
      // if there still are msg queue consuming, keep it going
      if (clientMsgQueue.length > 0) {
        clientMsgQueue.push(message);
      } else {
        proxyWs.send(message);
      }
    } else {
      clientMsgQueue.push(message);
    }
  };

  /**
   * consume the message in queue when the proxy ws is not ready yet
   * will handle them from the first one-by-one
   */
  const consumeMsgQueue = () => {
    while (clientMsgQueue.length > 0) {
      const message = clientMsgQueue.shift();
      proxyWs.send(message);
    }
  };

  /**
   * consruct a message Record from message event
   * @param @required {object} finalMsg based on the MessageEvent from websockt.onmessage
   * @param @required {boolean} isToServer whether the message is to or from server
   */
  const recordMessage = (finalMsg, isToServer) => {
    const message = {
      time: Date.now(),
      message: finalMsg.data,
      isToServer: isToServer
    };

    // resourceInfo.wsMessages.push(message);
    recorder && recorder.updateRecordWsMessage(resourceInfoId, message);
  };

  /**
   * prepare messageDetail object for intercept hooks
   * @param {object} messageEvent
   * @returns {object}
   */
  const prepareMessageDetail = (messageEvent) => {
    return {
      requestOptions: {
        port: serverInfo.port,
        hostname: serverInfo.hostname,
        path: serverInfo.path,
        secure: serverInfo.secure,
      },
      url: serverInfo.url,
      data: messageEvent.data,
    };
  };

  proxyWs.onopen = () => {
    consumeMsgQueue();
  };

  // this event is fired when the connection is build and headers is returned
  proxyWs.on('upgrade', (response) => {
    resourceInfo.endTime = new Date().getTime();
    const headers = response.headers;
    resourceInfo.res = { //construct a self-defined res object
      statusCode: response.statusCode,
      headers: headers,
    };

    resourceInfo.statusCode = response.statusCode;
    resourceInfo.resHeader = headers;
    resourceInfo.resBody = '';
    resourceInfo.length = resourceInfo.resBody.length;

    recorder && recorder.updateRecord(resourceInfoId, resourceInfo);
  });

  proxyWs.onerror = (e) => {
    // https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent#Status_codes
    wsClient.close(1001, e.message);
    proxyWs.close(1001);
  };

  proxyWs.onmessage = (event) => {
    co(function *() {
      const modifiedMsg = (yield userRule.beforeSendWsMessageToClient(prepareMessageDetail(event))) || {};
      const finalMsg = {
        data: modifiedMsg.data || event.data,
      };
      recordMessage(finalMsg, false);
      wsClient.readyState === 1 && wsClient.send(finalMsg.data);
    });
  };

  proxyWs.onclose = (event) => {
    logUtil.debug(`proxy ws closed with code: ${event.code} and reason: ${event.reason}`);
    const targetCloseInfo = getCloseFromOriginEvent(event);
    wsClient.readyState !== 3 && wsClient.close(targetCloseInfo.code, targetCloseInfo.reason);
  };

  wsClient.onmessage = (event) => {
    co(function *() {
      const modifiedMsg = (yield userRule.beforeSendWsMessageToServer(prepareMessageDetail(event))) || {};
      const finalMsg = {
        data: modifiedMsg.data || event.data,
      };
      recordMessage(finalMsg, true);
      sendProxyMessage(finalMsg);
    });
  };

  wsClient.onclose = (event) => {
    logUtil.debug(`original ws closed with code: ${event.code} and reason: ${event.reason}`);
    const targetCloseInfo = getCloseFromOriginEvent(event);
    proxyWs.readyState !== 3 && proxyWs.close(targetCloseInfo.code, targetCloseInfo.reason);
  };
}

module.exports = function getWsHandler(userRule, recorder, wsClient, wsReq) {
  try {
    handleWs.call(this, userRule, recorder, wsClient, wsReq);
  } catch (e) {
    logUtil.debug('WebSocket Proxy Error:' + e.message);
    logUtil.debug(e.stack);
    console.error(e);
  }
}
