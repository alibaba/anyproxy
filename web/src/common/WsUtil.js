/*
* Utility for websocket
*
*/
import { message } from 'antd';

export function initWs(wsPort = 8003, key = '') {
  if(!WebSocket){
    throw (new Error('WebSocket is not supportted on this browser'));
  }

  const wsClient = new WebSocket(`ws://${location.hostname}:${wsPort}/${key}`);

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

