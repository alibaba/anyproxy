/**
* manage the websocket server, for proxy target only
*
*/
import * as ws from 'ws';
import * as http from 'http';
import * as https from 'https';
import logUtil from './log.js';

const WsServer = ws.Server;

/**
* get a new websocket server based on the server
* @param @required {object} config
                   {string} config.server
                   {handler} config.handler
*/
function getWsServer(config: {
  server: http.Server | https.Server;
  connHandler: (wsClient: ws, wsReq: http.IncomingMessage) => void;
}): ws.Server {
  const wss = new WsServer({
    server: config.server,
  });

  wss.on('connection', config.connHandler);

  wss.on('headers', (headers) => {
    headers.push('x-anyproxy-websocket:true');
  });

  wss.on('error', (e) => {
    logUtil.error(`error in websocket proxy: ${e.message},\r\n ${e.stack}`);
    console.error('error happened in proxy websocket:', e);
  });

  wss.on('close', (e) => {
    console.error('==> closing the ws server');
  });

  return wss;
}

export default {
  getWsServer,
};

