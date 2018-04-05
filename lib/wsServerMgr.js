/**
* manage the websocket server
*
*/
const ws = require('ws');
const logUtil = require('./log.js');

const WsServer = ws.Server;

/**
* get a new websocket server based on the server
* @param @required {object} config
                   {string} config.server
                   {handler} config.handler
*/
function getWsServer(config) {
  const wss = new WsServer({
    server: config.server
  });

  wss.on('connection', config.connHandler);

  wss.on('headers', (headers) => {
    headers.push('x-anyproxy-websocket:true');
  });

  wss.on('error', e => {
    logUtil.error(`error in websocket proxy: ${e.message},\r\n ${e.stack}`);
    console.error('error happened in proxy websocket:', e)
  });

  wss.on('close', e => {
    console.error('==> closing the ws server');
  });

  return wss;
}

module.exports.getWsServer = getWsServer;
