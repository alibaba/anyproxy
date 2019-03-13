'use strict';

//websocket server manager

const WebSocketServer = require('ws').Server;
const logUtil = require('./log');

function resToMsg(msg, recorder, cb) {
  let result = {},
    jsonData;

  try {
    jsonData = JSON.parse(msg);
  } catch (e) {
    result = {
      type: 'error',
      error: 'failed to parse your request : ' + e.toString()
    };
    cb && cb(result);
    return;
  }

  if (jsonData.reqRef) {
    result.reqRef = jsonData.reqRef;
  }

  if (jsonData.type === 'reqBody' && jsonData.id) {
    result.type = 'body';
    recorder.getBody(jsonData.id, (err, data) => {
      if (err) {
        result.content = {
          id: null,
          body: null,
          error: err.toString()
        };
      } else {
        result.content = {
          id: jsonData.id,
          body: data.toString()
        };
      }
      cb && cb(result);
    });
  } else { // more req handler here
    return null;
  }
}

//config.server

class wsServer {
  constructor(config, recorder) {
    if (!recorder) {
      throw new Error('proxy recorder is required');
    } else if (!config || !config.server) {
      throw new Error('config.server is required');
    }

    const self = this;
    self.config = config;
    self.recorder = recorder;
  }

  start() {
    const self = this;
    const config = self.config;
    const recorder = self.recorder;
    return new Promise((resolve, reject) => {
      //web socket interface
      const wss = new WebSocketServer({
        server: config.server,
        clientTracking: true,
      });
      resolve();

      // the queue of the messages to be delivered
      let messageQueue = [];
      // the flat to indicate wheter to broadcast the record
      let broadcastFlag = true;

      setInterval(() => {
        broadcastFlag = true;
        sendMultipleMessage();
      }, 50);

      function sendMultipleMessage(data) {
        // if the flag goes to be true, and there are records to send
        if (broadcastFlag && messageQueue.length > 0) {
          wss && wss.broadcast({
            type: 'updateMultiple',
            content: messageQueue
          });
          messageQueue = [];
          broadcastFlag = false;
        } else {
          data && messageQueue.push(data);
        }
      }

      wss.broadcast = function (data) {
        if (typeof data === 'object') {
          try {
            data = JSON.stringify(data);
          } catch (e) {
            console.error('==> error when do broadcast ', e, data);
          }
        }
        for (const client of wss.clients) {
          try {
            client.send(data);
          } catch (e) {
            logUtil.printLog('websocket failed to send data, ' + e, logUtil.T_ERR);
          }
        }
      };

      wss.on('connection', (ws) => {
        ws.on('message', (msg) => {
          resToMsg(msg, recorder, (res) => {
            res && ws.send(JSON.stringify(res));
          });
        });

        ws.on('error', (e) => {
          console.error('error in ws:', e);
        });
      });

      wss.on('error', (e) => {
        logUtil.printLog('websocket error, ' + e, logUtil.T_ERR);
      });

      wss.on('close', () => { });

      recorder.on('update', (data) => {
        try {
          sendMultipleMessage(data);
        } catch (e) {
          console.log('ws error');
          console.log(e);
        }
      });

      recorder.on('updateLatestWsMsg', (data) => {
        try {
          // console.info('==> update latestMsg ', data);
          wss && wss.broadcast({
            type: 'updateLatestWsMsg',
            content: data
          });
        } catch (e) {
          logUtil.error(e.message);
          logUtil.error(e.stack);
          console.error(e);
        }
      });

      self.wss = wss;
    });
  }

  closeAll() {
    const self = this;
    return new Promise((resolve, reject) => {
      self.wss.close((e) => {
        if (e) {
          reject(e);
        } else {
          resolve();
        }
      });
    });
  }
}

module.exports = wsServer;
