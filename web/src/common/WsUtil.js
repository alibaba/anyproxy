/*
* Utility for websocket
*
*/
import { message } from 'antd';

/**
* Initiate a ws connection.
* The default path `do-not-proxy` means the ws do not need to be proxied.
* This is very important for AnyProxy‘s own server, such as WEB UI, 
* and the websocket detail panel in it, to prevent a recursive proxy.
* @param {wsPort} wsPort the port of websocket
* @param {key} path the path of the ws url
*
*/
export function initWs(wsPort = location.port, path = 'do-not-proxy') {
  if(!WebSocket){
    throw (new Error('WebSocket is not supportted on this browser'));
  }

  const wsClient = new WebSocket(`ws://${location.hostname}:${wsPort}/${path}`);

  wsClient.onerror = (error) => {
    console.error(error);
    message.error('error happened when setup websocket');
  };

  wsClient.onopen = (e) => {
    console.info('websocket opened: ', e);
  };

  wsClient.onclose = (e) => {
    console.info('websocket closed: ', e);
  };

  return wsClient;
}

export default {
  initWs: initWs
};
