/*
* test for proxy auth
*
*/

const ProxyServerUtil = require('./util/ProxyServerUtil.js');
const { proxyGet, generateUrl } = require('./util/HttpUtil.js');
const Server = require('./server/server.js');
const { printLog } = require('./util/CommonUtil.js');

testAuth('http');
testAuth('https');

function testAuth(protocol) {
    describe('Proxy auth should be working in :' + protocol, () => {
        let proxyServer ;
        let serverInstance ;

        beforeAll((done) => {
            jasmine.DEFAULT_TIMEOUT_INTERVAL = 2000000;
            printLog('Start server for proxy_auth_spec');

            global.auth = null;
            serverInstance = new Server();

            proxyServer = ProxyServerUtil.proxyServerWithProxyAuth();

            setTimeout(function() {
                done();
            }, 2000);
        });

        afterAll(() => {
            serverInstance && serverInstance.close();
            proxyServer && proxyServer.close();
            global.auth = null;
            printLog('Close server for proxy_auth_spec');

        });

        it('Should be return 407 if not set proxy auth', done => {
            const url = generateUrl(protocol, '/test');
            proxyGet(url, {})
                .then(res => {
                    if (protocol === 'http') {
                        expect(res.statusCode).toEqual(407);
                        expect(res.body).toEqual('');
                        done();
                    } else {
                        console.log('error happened in proxy get for proxy auth without auth');
                        done.fail('error happened when test proxy auth without auth');
                    }
                }, error => {
                    if (protocol === 'http') {
                        console.log('error happened in proxy get for proxy auth without auth: ', error);
                        done.fail('error happened when test proxy auth without auth');
                    } else {
                        expect(error.message.slice(-3)).toEqual('407');
                        done();
                    }
                });
        });

        it('Should be return 401 if proxy auth failed', done => {
            const url = generateUrl(protocol, '/test');
            proxyGet(url, {}, {'Proxy-Authorization': 'Basic Y2hvcGluOnBhc3M='})
                .then(res => {
                    if (protocol === 'http') {
                        expect(res.statusCode).toEqual(401);
                        expect(res.body).toEqual('');
                        done();
                    } else {
                        console.log('error happened in proxy get for proxy auth with error pass');
                        done.fail('error happened when test proxy auth with error pass');
                    }
                }, error => {
                    if (protocol === 'http') {
                        console.log('error happened in proxy get for proxy auth with error pass: ', error);
                        done.fail('error happened when test proxy auth with error pass');
                    } else {
                        expect(error.message.slice(-3)).toEqual('401');
                        done();
                    }
                });
        });

        it('Should be normal if proxy auth success', done => {
            const url = generateUrl(protocol, '/test');
            proxyGet(url, {}, {'Proxy-Authorization': 'Basic Y2hvcGluOm5nbw=='})
                .then(res => {
                    expect(res.statusCode).toEqual(200);
                    expect(res.body).toEqual('something');
                    done();
                }, error => {
                    console.log('error happened in proxy get for proxy auth: ', error);
                    done.fail('error happened when test proxy auth');
                });
        });
    });
}
