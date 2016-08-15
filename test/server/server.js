const Koa = require('koa');
const KoaRouter = require('koa-router');
const koaBody = require('koa-body');
const send = require('koa-send');
const path = require('path');
const https = require('https');
const certMgr = require("../../lib/certMgr");
const fs = require('fs');
const websocket = require('koa-websocket');
const wsRouter = require('koa-router')();
const color = require('colorful');
const WebSocketServer = require('ws').Server;

const DEFAULT_PORT = 3000;
const HTTPS_PORT = 3001;
const UPLOAD_DIR = './test/temp';
const PROXY_KEY_PREFIX = 'proxy-';

function KoaServer() {
    this.httpServer = null;
    this.httpsServer = null;
    this.requestRecordMap = {}; // store all request data to the map
    const self = this;

    /**
     * log the request info, write as
     */
    this.logRequest = function* (next) {
        const headers = this.request.headers;
        let key = this.request.host + this.request.url;

        // take proxy data with 'proxy-' + url
        if (headers['via-proxy'] === 'true') {
            key = PROXY_KEY_PREFIX + key;
        }

        let body = this.request.body;
        body = typeof body === 'object' ? JSON.stringify(body) : body;
        self.requestRecordMap[key] = {
            headers: headers,
            body: body
        };
        yield next;
    };

    this.start();
}

KoaServer.prototype.constructRouter = function() {
    const router = KoaRouter();
    router.post('/test/getuser', this.logRequest, koaBody(),  function*(next) {
        printLog('requesting post /test/getuser');
        this.response.set('reqbody', JSON.stringify(this.request.body));
        this.response.body = 'something in post';
    });

    router.get('/test', this.logRequest, function*(next) {
        printLog('request in get: ' + JSON.stringify(this.request));
        this.response.body = 'something';
        this.response.__req = this.request;
        printLog('response in get:' + JSON.stringify(this.response));
    });

    router.get('/test/uselocal', this.logRequest, function*(next) {
        printLog('request in get local:' + JSON.stringify(this.request));
        this.response.body = 'something should be in local';
        this.response.__req = this.request;
        printLog('response in get:' + JSON.stringify(this.response));
    });

    ['png', 'webp', 'json', 'js', 'css', 'ttf', 'eot', 'svg', 'woff', 'woff2'].forEach(item => {
        router.get(`/test/download/${item}`, this.logRequest, function* (next) {
            printLog(`now downloading the ${item}`);
            yield send(this, `test/data/test.${item}`);
        });
    });

    router.get('/test/response/303', function*(next) {
        printLog('now to redirect 303');
        this.redirect('/test');
        this.status = 303;
    });

    router.get('/test/response/302', function*(next) {
        printLog('now to redirect 302');
        this.redirect('/test');
    });

    router.get('/test/response/301', function*(next) {
        printLog('now to redirect permanently');
        this.redirect('/test');
        this.status = 301;
    });

    const onFileBegin = function(name, file) {
        if (!fs.existsSync('./test/temp')) {
            try {
                fs.mkdirSync('./test/temp', '0777');
            } catch (e) {
                return null;
            }
        }

        file.name = 'test_upload_' + Date.now() + '.png';
        var folder = path.dirname(file.path);
        file.path = path.join(folder, file.name);

    };

    router.post('/test/upload/png',
        this.logRequest,
        koaBody({
            multipart: true,
            formidable: {
                uploadDir: UPLOAD_DIR,
                onFileBegin: onFileBegin
            }
        }),
        function*(next) {
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
                onFileBegin: onFileBegin
            }
        }),
        function*(next) {
            const file = this.request.body.files.file;
            this.response.body = file.path;
        }
    );

    router.put('/test/put', koaBody(), this.logRequest, function*(next) {
        printLog('requesting put /test/put' + JSON.stringify(this.request));
        this.response.body = 'something in put';
    });

    router.delete('/test/delete/:id', this.logRequest, function*(next) {
        printLog('requesting delete /test/delete/:id'+ JSON.stringify(this.params));
        this.response.body = 'something in delete';
    });

    router.head('/test/head', this.logRequest, function*(next) {
        printLog('requesting head /test/head');
        this.response.body = ''; // the body will not be passed to response, in HEAD request
        this.response.set('reqBody', 'head_request_contains_no_resbody');
    });

    router.options('/test/options', this.logRequest, function*(next) {
        printLog('requesting options /test/options');
        this.response.body = 'could_be_empty';
        this.response.set('Allow', 'GET, HEAD, POST, OPTIONS');
    });

    // router.connect('/test/connect', function *(next) {
    //     printLog('requesting connect /test/connect');
    //     this.response.body = 'connect_established_body';
    // });

    return router;
};

KoaServer.prototype.constructWsRouter = function() {
    const wsRouter = KoaRouter();
    const self = this;
    wsRouter.get('/test/socket', function*(next) {
        const ws = this.websocket;
        const messageObj = {
            type: 'initial',
            content: 'default message'
        };

        ws.send(JSON.stringify(messageObj));
        ws.on('message', message => {
            printLog('message from request socket: ' + message);
            self.handleRecievedMessage(ws, message);
        });
        yield next;
    });

    return wsRouter;
};

KoaServer.prototype.getRequestRecord = function (key) {
    return this.requestRecordMap[key] || {};
};

KoaServer.prototype.getProxyRequestRecord = function (key) {
    key = PROXY_KEY_PREFIX + key;
    return this.requestRecordMap[key] || {};
};

KoaServer.prototype.handleRecievedMessage = function(ws, message) {
    const newMessage = {
        type: 'onMessage',
        content: message
    };
    ws.send(JSON.stringify(newMessage));
};

KoaServer.prototype.start = function() {
    printLog('Starting the server...');
    const router = this.constructRouter();
    const wsRouter = this.constructWsRouter();
    const self = this;
    const app = Koa();
    websocket(app);

    app.use(router.routes());
    app.ws.use(wsRouter.routes());
    this.httpServer = app.listen(DEFAULT_PORT);

    printLog('HTTP is now listening on port :' + DEFAULT_PORT);

    certMgr.getCertificate('localhost', function(error, keyContent, crtContent) {
        if (error) {
            console.error('failed to create https server:', error);
        } else {
            self.httpsServer = https.createServer({
                key: keyContent,
                cert: crtContent
            }, app.callback());

            // create wss server
            const wss = new WebSocketServer({
                server: self.httpsServer
            });

            wss.on('connection', function connection(ws) {
                ws.on('message', function incoming(message) {
                    printLog('received in wss: ' + message);
                    self.handleRecievedMessage(ws, message);
                });

            });

            wss.on('error', error => {
                console.error('erro happened in wss:%s', error);
            });

            self.httpsServer.listen(HTTPS_PORT);

            printLog('HTTPS is now listening on port :' + HTTPS_PORT);

            printLog('Server started successfully');
        }
    });

    return this;
};

KoaServer.prototype.close = function() {
    printLog('Closing server now...');
    this.httpServer && this.httpServer.close();
    this.httpsServer && this.httpsServer.close();
    this.requestRecordMap = {};
    printLog('Server closed successfully');
};


function printLog(content) {
    console.log(color.cyan('===SERVER LOG===' + content));
}


module.exports = KoaServer;