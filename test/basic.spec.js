
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const path = require('path');
const fs = require('fs');
const urllib = require('urllib');
const { basicProxyRequest, proxyServerWithRule, } = require('./util.js');
const WebSocket = require('ws');
const tunnel = require('tunnel');

let proxyServer;
let proxyPort;
let proxyHost;
let proxyWebInterfaceHost;
beforeAll(async () => {
  jest.DEFAULT_TIMEOUT_INTERVAL = 20 * 1000;
  proxyServer = await proxyServerWithRule({}, {});
  proxyPort = proxyServer.proxyPort;
  proxyHost = `http://localhost:${proxyPort}`;
  const proxyWebInterfacePort = proxyServer.webServerInstance.webPort;
  proxyWebInterfaceHost = `http://localhost:${proxyWebInterfacePort}`;
});

afterAll(() => {
  return proxyServer && proxyServer.close();
});

['http'].forEach(protocol => {
  describe.only(`${protocol} - HTTP verbs`, () => {
    const assertProxyRes = (result) => {
      const proxyRes = result.response;
      const body = JSON.parse(result.body);
      expect(proxyRes.statusCode).toBe(200);
      expect(body.args).toMatchSnapshot('args');
      expect(body.data).toMatchSnapshot('data');
      return body;
    };
  
    it('GET', async () => {
      const url = `${protocol}://httpbin.org/get`;
      const getParam = {
        param: 'param_value'
      };
      await basicProxyRequest(proxyHost, 'GET', url, {}, getParam).then(assertProxyRes);
    });
  
    it('POST body and header', async () => {
      const url = `${protocol}://httpbin.org/post`;
      const payloadStream = fs.createReadStream(path.resolve(__dirname, './fixtures/image.png'));
  
      const postHeaders = {
        anyproxy_header: 'header_value',
      };
  
      const body = await basicProxyRequest(proxyHost, 'POST', url, postHeaders, {}, payloadStream).then(assertProxyRes);
      expect(body.headers['Anyproxy-Header']).toBe(postHeaders.anyproxy_header);
    });
  
    it('PUT', async () => {
      const url = `${protocol}://httpbin.org/put`;
      const payloadStream = fs.createReadStream(path.resolve(__dirname, './fixtures/image.png'));
      await basicProxyRequest(proxyHost, 'PUT', url, {}, undefined, payloadStream).then(assertProxyRes);
    });
  
    it('DELETE', async () => {
      const url = `${protocol}://httpbin.org/delete`;
      const param = {
        foo: 'bar',
      };
      await basicProxyRequest(proxyHost, 'DELETE', url, {}, param).then(assertProxyRes);
    });
  
    it('PATCH', async () => {
      const url = `${protocol}://httpbin.org/patch`;
      await basicProxyRequest(proxyHost, 'PATCH', url).then(assertProxyRes);
    });

    describe.only('websocket', () => {
      const WS_PORT = 8012;
      let wsEchoServer;
      beforeAll(async () => {
        wsEchoServer = new WebSocket.WebSocketServer({ port: WS_PORT });
        wsEchoServer.on('connection', (ws) => {
          ws.on('message', (message) => {
            ws.send(message);
          });
        });
      });
      afterAll(async () => {
        wsEchoServer.close();
      });

      it('Websocket', async () => {
        const wsUrl = `${protocol === 'https' ? 'wss' : 'ws'}://127.0.0.1:${WS_PORT}`;
        let agent;
        if (wsUrl.indexOf('wss') === 0) {
          agent = new tunnel.httpsOverHttp({
            rejectUnauthorized: false,
            proxy: {
              hostname: 'localhost',
              port: proxyPort,
            }
          });
        } else {
          agent = new tunnel.httpOverHttp({
            proxy: {
              hostname: 'localhost',
              port: proxyPort,
            }
          });
        }

        agent.on('free', (a, b, c) => {
          console.log('agent on Free', a, b, c);
        })
      
        const ws = new WebSocket(wsUrl, {
          agent,
          rejectUnauthorized: false,
          headers: {},
        });

        await new Promise((resolve, reject) => {
          const wsMsg = Buffer.alloc(100 * 1024, 'a');

          ws.on('open', () => {
            ws.send(wsMsg);
          });
    
          ws.on('message', (msg) => {
            expect(msg.equals(wsMsg));
            ws.close();
            setTimeout(resolve, 300); // some clean up job
          });
        });
      });
    });
  });
});

describe('status code and headers', () => {
  [302, 404, 500].forEach(statusCode => {
    it(`GET ${statusCode}`, async () => {
      const status = statusCode;
      const url = `http://httpbin.org/status/${status}`;
      const result = await basicProxyRequest(proxyHost, 'GET', url, {}, {});
      const proxyRes = result.response;
      expect(proxyRes.statusCode).toBe(statusCode);
    });

    it(`PUT ${statusCode}`, async () => {
      const status = statusCode;
      const url = `http://httpbin.org/status/${status}`;
      const result = await basicProxyRequest(proxyHost, 'PUT', url, {}, {});
      const proxyRes = result.response;
      expect(proxyRes.statusCode).toBe(statusCode);
    });
  });
});

describe('response data formats', () => {
  ['brotli', 'deflate', 'gzip'].forEach(encoding => {
    it(`GET ${encoding}`, async () => {
      const url = `http://httpbin.org/${encoding}`;
      const result = await basicProxyRequest(proxyHost, 'GET', url);
      const headers = result.response.headers;
      const body = JSON.parse(result.body);
      expect(headers['content-encoding']).toBeUndefined(); // should be removed by anyproxy
      expect(body.brotli || body.deflated || body.gzipped).toBeTruthy();
    });
  });
});

// describe('big files', () => {
//   const BIG_FILE_SIZE = 100 * 1024 * 1024 - 1; // 100 mb
//   const BUFFER_FILL = 'a';

//   let server;
//   beforeAll(() => {
//     server = http.createServer({}, (req, res) => {
//       if (/download/.test(req.url)) {
//         const bufferContent = Buffer.alloc(BIG_FILE_SIZE, BUFFER_FILL);
//         res.write(bufferContent);
//         res.end();
//       } else if (/upload/.test(req.url)) {
//         let reqPayloadSize = 0;
//         req.on('data', (data) => {
//           const bufferLength = data.length;
//           reqPayloadSize += bufferLength;
//           const expectBufferContent = Buffer.alloc(bufferLength, BUFFER_FILL);
//           if (!expectBufferContent.equals(data)) {
//             res.statusCode = 500;
//             res.write('content not match');
//           }
//         }).on('end', () => {
//           if (res.statusCode === 500 || reqPayloadSize !== BIG_FILE_SIZE) {
//             res.statusCode = 500;
//           } else {
//             res.statusCode = 200;
//           }
//           res.end();
//         });
//       }
//     });

//     server.listen(3000);
//   });

//   afterAll((done) => {
//     server && server.close(done);
//   });

//   it('download big file', (done) => {
//     let responseSizeCount = 0;
//     request({
//       url: 'http://127.0.0.1:3000/download',
//       proxy: proxyHost,
//     }).on('data', (data) => {
//       const bufferLength = data.length;
//       responseSizeCount += bufferLength;
//       const expectBufferContent = Buffer.alloc(bufferLength, BUFFER_FILL);
//       if (!expectBufferContent.equals(data)) {
//         return done(new Error('download content not match'));
//       }
//     }).on('end', () => {
//       if (responseSizeCount !== BIG_FILE_SIZE) {
//         return done(new Error('file size not match'));
//       }
//       done();
//     });
//   }, 120 * 1000);

//   it('upload big file', (done) => {
//     const bufferContent = Buffer.alloc(BIG_FILE_SIZE, BUFFER_FILL);
//     const req = request({
//       url: 'http://127.0.0.1:3000/upload',
//       method: 'POST',
//       proxy: proxyHost,
//     }, (err, response, body) => {
//       if (err) {
//         return done(err);
//       } else if (response.statusCode !== 200) {
//         return done(new Error('upload failed ' + body));
//       }
//       done();
//     });
//     req.write(bufferContent);
//     req.end();
//   }, 120 * 1000);
// });

describe('web interface', () => {
  it('should be available', async () => {
    await urllib.request(proxyWebInterfaceHost).then((result) => {
      expect(result.status).toBe(200);
    });
  });
});
