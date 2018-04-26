const Koa = require('koa');
const KoaRouter = require('koa-router');
const koaBody = require('koa-body');
const send = require('koa-send');
const path = require('path');
const https = require('https');
const certMgr = require('../../lib/certMgr');
const fs = require('fs');
const nurl = require('url');
const color = require('colorful');
const WebSocketServer = require('ws').Server;
const tls = require('tls');
const crypto = require('crypto');

const createSecureContext = tls.createSecureContext || crypto.createSecureContext;

const DEFAULT_PORT = 3000;
const HTTPS_PORT = 3001;
const HTTPS_PORT2 = 3002; // start multiple https server
const UPLOAD_DIR = path.resolve(__dirname, '../temp');
const PROXY_KEY_PREFIX = 'proxy-';

function SNICertCallback(serverName, SNICallback) {
  certMgr.getCertificate(serverName, (err, key, crt) => {
    if (err) {
      console.error('error happend in sni callback', err);
      return;
    }
    const ctx = createSecureContext({
      key,
      cert: crt
    });

    SNICallback(null, ctx);
  });
}

function KoaServer() {
  this.httpServer = null;
  this.httpsServer = null;
  this.requestRecordMap = {}; // store all request data to the map
  const self = this;

  /**
   * log the request info, write as
   */
  this.logRequest = function *(next) {
    const headers = this.request.headers;
    let key = this.request.protocol + '://' + this.request.host + nurl.parse(this.request.url).pathname; // remove param to get clean key

    // take proxy data with 'proxy-' + url
    if (headers['via-proxy'] === 'true') {
      key = PROXY_KEY_PREFIX + key;
    }

    printLog('log request with key :' + key);
    let body = this.request.body;
    body = typeof body === 'object' ? JSON.stringify(body) : body;

    self.requestRecordMap[key] = {
      headers,
      body
    };
    yield next;
  };

  this.logWsRequest = function (wsReq) {
    const headers = wsReq.headers;
    const host = headers.host;
    const isEncript = true && wsReq.connection && wsReq.connection.encrypted;
    const protocol = isEncript ? 'wss' : 'ws';
    let key = `${protocol}://${host}${wsReq.url}`;
    // take proxy data with 'proxy-' + url
    if (headers['via-proxy'] === 'true') {
      key = PROXY_KEY_PREFIX + key;
    }

    self.requestRecordMap[key] = {
      headers: wsReq.headers,
      body: ''
    }
  };

  this.start();
}

KoaServer.prototype.constructRouter = function () {
  const router = KoaRouter();
  router.post('/test/getuser', koaBody(), this.logRequest, function *(next) {
    printLog('requesting post /test/getuser');
    this.response.set('reqbody', JSON.stringify(this.request.body));
    this.response.body = 'body_post_getuser';
  });

  router.get('/test', this.logRequest, function *(next) {
    printLog('request in get: ' + JSON.stringify(this.request));
    this.cookies.set('a1', 'a1value');
    this.cookies.set('a2', 'a2value');
    this.cookies.set('a3', 'a3value');
    this.response.set('header1', 'cookie2=headervalue2');

    this.response.body = 'something';
    this.response.__req = this.request;
    printLog('response in get:' + JSON.stringify(this.response));
  });

  router.get('/test/uselocal', this.logRequest, function *(next) {
    printLog('request in get local:' + JSON.stringify(this.request));
    this.response.body = 'something should be in local';
    // this.response.__req = this.request;
    printLog('response in get:' + JSON.stringify(this.response));
  });

  ['png', 'webp', 'json', 'js', 'css', 'ttf', 'eot', 'svg', 'woff', 'woff2'].forEach(item => {
    router.get(`/test/download/${item}`, this.logRequest, function *(next) {
      yield send(this, `./data/test.${item}`, {
        root: path.resolve(__dirname, '../')
      });
    });
  });

  router.get('/test/response/304', this.logRequest, function *(next) {
    this.response.set('Content-Encoding', 'gzip');
    this.status = 304;
  });

  router.get('/test/response/303', function *(next) {
    printLog('now to redirect 303');
    this.redirect('/test');
    this.status = 303;
  });

  router.get('/test/response/302', function *(next) {
    printLog('now to redirect 302');
    this.redirect('/test');
  });

  router.get('/test/response/301', function *(next) {
    printLog('now to redirect permanently');
    this.redirect('/test');
    this.status = 301;
  });

  const onFileBegin = function (name, file) {
    if (!fs.existsSync(UPLOAD_DIR)) {
      try {
        fs.mkdirSync(UPLOAD_DIR, '0777');
      } catch (e) {
        console.log(e);
        return null;
      }
    }

    file.name = 'test_upload_' + Date.now() + '.png';
    const folder = path.dirname(file.path);
    file.path = path.join(folder, file.name);
  };

  router.post('/test/upload/png',
    this.logRequest,
    koaBody({
      multipart: true,
      formidable: {
        uploadDir: UPLOAD_DIR,
        onFileBegin
      }
    }),
    function *(next) {
      const file = this.request.body.files.file;
      this.response.set('reqbody', JSON.stringify(this.request.body.fields));
      this.response.body = file.path;
    }
  );

  router.put('/test/upload/putpng',
    this.logRequest,
    koaBody({
      multipart: true,
      formidable: {
        uploadDir: UPLOAD_DIR,
        onFileBegin
      }
    }),
    function *(next) {
      const file = this.request.body.files.file;
      this.response.body = file.path;
    }
  );

  router.put('/test/put', koaBody(), this.logRequest, function *(next) {
    printLog('requesting put /test/put' + JSON.stringify(this.request));
    this.response.body = 'something in put';
  });

  router.delete('/test/delete/:id', this.logRequest, function *(next) {
    printLog('requesting delete /test/delete/:id' + JSON.stringify(this.params));
    this.response.body = 'something in delete';
  });

  router.head('/test/head', this.logRequest, function *(next) {
    printLog('requesting head /test/head');
    this.response.body = ''; // the body will not be passed to response, in HEAD request
    this.response.set('reqBody', 'head_request_contains_no_resbody');
  });

  router.options('/test/options', this.logRequest, function *(next) {
    printLog('requesting options /test/options');
    this.response.body = 'could_be_empty';
    this.response.set('Allow', 'GET, HEAD, POST, OPTIONS');
  });

  // router.connect('/test/connect', function *(next) {
  //     printLog('requesting connect /test/connect');
  //     this.response.body = 'connect_established_body';
  // });

  router.get('/test/should_not_replace_option', this.logRequest, function *(next) {
    this.response.body = 'the_option_that_not_be_replaced';
  });

  router.get('/test/should_replace_option', this.logRequest, function *(next) {
    this.response.body = 'the_request_that_has_not_be_replaced';
  });

  router.get('/test/new_replace_option', this.logRequest, function *(next) {
    this.response.body = 'the_new_replaced_option_page_content';
  });

  router.get('/test/normal_request1', this.logRequest, koaBody(), function *(next) {
    printLog('requesting get /test/normal_request1');
    this.response.body = 'body_normal_request1';
  });

  router.get('/test/normal_request2', this.logRequest, koaBody(), function *(next) {
    printLog('requesting get /test/normal_request2');
    this.response.body = 'body_normal_request2';
  });

  router.post('/test/normal_post_request1', koaBody(), this.logRequest, function *(next) {
    printLog('requesting post /test/normal_post_request1');
    this.response.body = 'body_normal_post_request1';
  });

  router.get('/big_response', this.logRequest, function *(next) {
    const buf = new Buffer(1 * 1024 * 1024 * 1024); // 1GB
    buf.fill(1);
    printLog('request in get big response of 1GB');
    this.response.type = 'application/octet-stream';
    this.response.body = buf;
  });

  return router;
};

KoaServer.prototype.createWsServer = function (httpServer) {
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/test/socket'
  });
  wsServer.on('connection', (ws, wsReq) => {
    const self = this;
    self.logWsRequest(wsReq);
    const messageObj = {
      type: 'initial',
      content: 'default message'
    };

    ws.send(JSON.stringify(messageObj));
    ws.on('message', message => {
      printLog('message from request socket: ' + message);
      self.handleRecievedMessage(ws, message);
    });
  })
};

KoaServer.prototype.getRequestRecord = function (key) {
  return this.requestRecordMap[key] || null;
};

KoaServer.prototype.getProxyRequestRecord = function (key) {
  key = PROXY_KEY_PREFIX + key;
  return this.requestRecordMap[key] || null;
};

KoaServer.prototype.handleRecievedMessage = function (ws, message) {
  const newMessage = {
    type: 'onMessage',
    content: message
  };
  ws.send(JSON.stringify(newMessage));
};

KoaServer.prototype.start = function () {
  printLog('Starting the server...');
  const router = this.constructRouter();
  const self = this;
  const app = Koa();

  app.use(router.routes());
  this.httpServer = app.listen(DEFAULT_PORT);
  this.createWsServer(this.httpServer);


  printLog('HTTP is now listening on port :' + DEFAULT_PORT);

  certMgr.getCertificate('localhost', (error, keyContent, crtContent) => {
    if (error) {
      console.error('failed to create https server:', error);
    } else {
      self.httpsServer = https.createServer({
        SNICallback: SNICertCallback,
        key: keyContent,
        cert: crtContent
      }, app.callback());

      // create wss server
      const wss = new WebSocketServer({
        server: self.httpsServer
      });

      wss.on('connection', (ws, wsReq) => {
        self.logWsRequest(wsReq);
        ws.on('message', (message) => {
          printLog('received in wss: ' + message);
          self.handleRecievedMessage(ws, message);
        });
      });

      wss.on('error', e => console.error('error happened in wss:%s', e));

      self.httpsServer.listen(HTTPS_PORT);

      self.httpsServer2 = https.createServer({
        key: keyContent,
        cert: crtContent
      }, app.callback());

      self.httpsServer2.listen(HTTPS_PORT2);

      printLog('HTTPS is now listening on port :' + HTTPS_PORT);

      printLog('Server started successfully');
    }
  });

  return this;
};

KoaServer.prototype.close = function () {
  printLog('Closing server now...');
  this.httpServer && this.httpServer.close();
  this.httpsServer && this.httpsServer.close();
  this.httpsServer2 && this.httpsServer2.close();
  this.requestRecordMap = {};
  printLog('Server closed successfully');
};


function printLog(content) {
  console.log(color.cyan('[SERVER LOG]: ' + content));
}

module.exports = KoaServer;
