const http = require('http');
const querystring = require('querystring');
const path = require('path');
const fs = require('fs');
const Buffer = require('buffer').Buffer;
const Server = require('./server/server.js');
const
    {
        proxyGet,
        proxyPost,
        directGet,
        directPost,
        directUpload,
        proxyUpload,
        generateUrl,
        proxyPut,
        directPut,
        proxyDelete,
        directDelete,
        directHead,
        proxyHead,
        directOptions,
        proxyOptions,
        proxyPutUpload,
        directPutUpload
    } = require('./util/HttpUtil.js');
const { CommonRequestHeader } = require('./data/headers.js');
const { isCommonResHeaderEqual, isCommonReqEqual, printLog } = require('./util/CommonUtil.js');
const color = require('colorful');
const streamEqual = require('stream-equal');
const WebSocket = require('ws');

const ProxyServerUtil = require('./util/ProxyServerUtil.js');

const wsHost = 'ws://localhost:3000/test/socket';

testRequest('http');
testRequest('https');

// Test suites for http and https request
function testRequest(protocol = 'http') {

    function constructUrl(urlPath) {
        return generateUrl(protocol, urlPath);
    }

    describe('Test request without proxy rules in protocol ' + protocol, () => {
        let proxyServer ;
        let serverInstance;

        beforeAll((done) => {
            jasmine.DEFAULT_TIMEOUT_INTERVAL = 200000;
            printLog('Start server for no_rule_spec');

            serverInstance = new Server();
            proxyServer = ProxyServerUtil.defaultProxyServer();
            setTimeout(function() {
                done();
            }, 2000);
        });

        afterAll(() => {
            serverInstance && serverInstance.close();
            proxyServer && proxyServer.close();
            printLog('Closed server for no_rule_spec');
        });


        it('Get should work as direct without proxy rules', (done) => {
            const url = constructUrl('/test');
            const getParam = {
                param: 'nothing'
            };

            proxyGet(url, getParam, CommonRequestHeader).then((proxyRes) => {
                directGet(url, getParam, CommonRequestHeader).then(directRes => {

                    expect(proxyRes.statusCode).toEqual(200);

                    expect(isCommonResHeaderEqual(directRes.headers, proxyRes.headers, url)).toBe(true);
                    expect(isCommonReqEqual(url, serverInstance)).toBe(true);
                    expect(proxyRes.statusCode).toEqual(directRes.statusCode);
                    expect(directRes.body).toEqual(proxyRes.body);

                    done();
                }, error => {
                    console.error('error happend in direct get:', error);
                    done.fail('error happend in direct get');
                });

            }, error => {
                console.log('error happened in proxy get:', error);
                done.fail('error happend in proxy get');
            });
        });

        it('Post should work as direct without proxy rules', (done) => {
            const url = constructUrl('/test/getuser');
            const param = {
                param: 'postnothing'
            };

            proxyPost(url, param, CommonRequestHeader).then(proxyRes => {
                directPost(url, param, CommonRequestHeader).then(directRes => {

                    expect(proxyRes.statusCode).toEqual(200);

                    expect(isCommonResHeaderEqual(directRes.headers, proxyRes.headers, url)).toBe(true);
                    expect(proxyRes.statusCode).toEqual(directRes.statusCode);
                    expect(directRes.body).toEqual(proxyRes.body);

                    expect(isCommonReqEqual(url, serverInstance)).toBe(true);

                    done();
                }, error => {
                    console.error('error in direct post:', error);
                    done.fail('error happend in direct post');
                });

            }, error => {
                console.log('error happened in proxy post,', error);
                done.fail('error happend in proxy post');
            });
        });

        it('PUT should work as direct without proxy rules', done => {
            const url = constructUrl('/test/put');
            const param = {
                param: 'putsomething'
            };
            proxyPut(url, param, CommonRequestHeader).then(proxyRes => {
                directPut(url, param, CommonRequestHeader).then(directRes => {
                    expect(directRes.statusCode).toEqual(200);

                    expect(isCommonResHeaderEqual(directRes.headers, proxyRes.headers, url)).toBe(true);
                    expect(directRes.statusCode).toEqual(proxyRes.statusCode);
                    expect(directRes.body).toEqual(proxyRes.body);
                    expect(isCommonReqEqual(url, serverInstance)).toBe(true);

                    done();
                }, error => {
                    console.error('error happened in direct put', error);
                    done.fail('error happened in direct put');
                });
            }, error => {
                console.error('error happened in proxy put', error);
                done.fail('error happened in proxy put');
            });

        });

        it('DELETE rquest should work as direct without proxy rules', (done) => {
            const url = constructUrl('/test/delete/123456');

            proxyDelete(url, {}, CommonRequestHeader).then(proxyRes => {
                directDelete(url, {}, CommonRequestHeader).then(directRes => {
                    expect(directRes.statusCode).toEqual(200);

                    expect(directRes.statusCode).toEqual(proxyRes.statusCode);
                    expect(isCommonResHeaderEqual(directRes.headers, proxyRes.headers, url)).toBe(true);
                    expect(directRes.body).toEqual(proxyRes.body);
                    expect(isCommonReqEqual(url, serverInstance)).toBe(true);

                    done();
                }, error => {
                    console.error('error happened in direct delete :', error);
                    done.fail('error happened in direct delete');
                });
            }, error => {
                console.error('error happened in proxy delete :', error);
                done.fail('error happened in proxy delete');
            });
        });

        it('HEAD request should work as direct without proxy rules', (done) => {
            const url = constructUrl('/test/head');

            proxyHead(url, CommonRequestHeader)
                .then(proxyRes => {
                    directHead(url, CommonRequestHeader)
                        .then(directRes => {
                            expect(directRes.statusCode).toEqual(200);
                            expect(directRes.body).toEqual('');

                            expect(directRes.statusCode).toEqual(proxyRes.statusCode);
                            expect(isCommonResHeaderEqual(directRes.headers, proxyRes.headers, url)).toBe(true);
                            expect(directRes.body).toEqual(proxyRes.body);
                            expect(isCommonReqEqual(url, serverInstance)).toBe(true);

                            done();
                        }, error => {
                            console.error('error happened in direct head request:', error);
                            done.fail('error happened in direct head request');
                        });
                }, error => {
                    console.error('error happened in proxy head request:', error);
                    done.fail('error happened in proxy head request');
                });

        });

        it('OPTIONS request should work as direct without proxy rules', (done) => {
            const url = constructUrl('/test/options');

            proxyOptions(url, CommonRequestHeader)
                .then(proxyRes => {
                    directOptions(url, CommonRequestHeader)
                        .then(directRes => {
                            expect(directRes.statusCode).toEqual(200);
                            expect(directRes.body).toEqual('could_be_empty');

                            expect(directRes.statusCode).toEqual(proxyRes.statusCode);
                            expect(isCommonResHeaderEqual(directRes.headers, proxyRes.headers, url)).toBe(true);
                            expect(directRes.body).toEqual(proxyRes.body);
                            expect(isCommonReqEqual(url, serverInstance)).toBe(true);

                            done();
                        }, error => {
                            console.error('error happened in direct options request:', error);
                            done.fail('error happened in direct options request');
                        });
                }, error => {
                    console.error('error happened in proxy options request:', error);
                    done.fail('error happened in proxy options request');
                });

        });

        describe('Response code should be honored as direct without proxy rules', () => {
            [301, 302, 303].forEach(code => {
                testRedirect(code);
            });

            function testRedirect (redirectCode) {
                it(`${redirectCode} response should work as direct without proxy rules`, (done) => {
                    const url = constructUrl(`/test/response/${redirectCode}`);

                    proxyGet(url)
                        .then(proxyRes => {
                            directGet(url)
                                .then(directRes => {
                                    const redirects = directRes.request._redirect.redirects || [];
                                    const proxyRedirects = proxyRes.request._redirect.redirects || [];
                                    expect(redirects.length).toEqual(1);
                                    expect(proxyRedirects.length).toEqual(1);

                                    expect(redirects[0].statusCode).toEqual(redirectCode);
                                    expect(redirects[0].redirectUri).toEqual(proxyRedirects[0].redirectUri);
                                    expect(redirects[0].statusCode).toEqual(proxyRedirects[0].statusCode);
                                    if (protocol === 'https') {
                                        expect(redirects[0].redirectUri).toEqual('https://localhost:3001/test');
                                    } else {
                                        expect(redirects[0].redirectUri).toEqual('http://localhost:3000/test');
                                    }
                                    done();
                                }, error => {
                                    console.log(`error happened in direct ${redirectCode}:`, error);
                                    done.fail(`error happened in direct ${redirectCode}`);
                                });

                        }, error => {
                            console.log(`error happened in proxy ${redirectCode}:`, error);
                            done.fail(`error happened in proxy ${redirectCode}`);
                        });

                });
            }
        });



        describe('Test file download ', () => {
            const testArray = [
                {
                    url: constructUrl('/test/download/png'),
                    type: 'png',
                    contentType: 'image/png'
                },
                {
                    url: constructUrl('/test/download/webp'),
                    type: 'WEBP',
                    contentType: 'image/webp'
                },
                {
                    url: constructUrl('/test/download/json'),
                    type: 'JSON',
                    contentType: 'application/json; charset=utf-8'
                },
                {
                    url: constructUrl('/test/download/css'),
                    type: 'CSS',
                    contentType: 'text/css; charset=utf-8'
                },
                {
                    url: constructUrl('/test/download/ttf'),
                    type: 'TTF',
                    contentType: 'application/x-font-ttf'
                },
                {
                    url: constructUrl('/test/download/eot'),
                    type: 'EOT',
                    contentType: 'application/vnd.ms-fontobject'
                },
                {
                    url: constructUrl('/test/download/svg'),
                    type: 'SVG',
                    contentType: 'image/svg+xml'
                },
                {
                    url: constructUrl('/test/download/woff'),
                    type: 'WOFF',
                    contentType: 'application/font-woff'
                },
                {
                    url: constructUrl('/test/download/woff2'),
                    type: 'WOFF2',
                    contentType: 'application/font-woff2'
                }
            ];

            testArray.forEach(item => {
                testFileDownload(item.url, item.type, item.contentType);
            });

            // 封装测试文件下载的测试工具类
            function testFileDownload (url, filetype, contentType) {
                const describe = `${filetype} file download without rules should be work as direct download`;
                const param = {};

                it(describe, (done) => {

                    proxyGet(url, param).then(proxyRes => {
                        directGet(url, param).then(directRes => {
                            expect(proxyRes.statusCode).toEqual(200);

                            expect(isCommonResHeaderEqual(directRes.headers, proxyRes.headers, url)).toBe(true);
                            expect(proxyRes.statusCode).toEqual(directRes.statusCode);
                            expect(proxyRes.body).toEqual(directRes.body);
                            expect(isCommonReqEqual(url, serverInstance)).toBe(true);

                            done();
                        }, error => {
                            console.error('error in direct get :', filetype, error);
                            done.fail(`error happend in direct get ${filetype}`);
                        });
                    }, error => {
                        console.error('error in proxy get :', filetype, error);
                        done.fail(`error happend in proxy get ${filetype}`);
                    });
                });
            }

        });

        describe('Test file upload', () => {
            const formParams = {
                param1: 'param_1',
                param2: 'param2'
            };
            it('POST upload should be working', (done) => {
                const url = constructUrl('/test/upload/png');
                const filePath = path.resolve('./test/data/test.png');

                proxyUpload(url, filePath, formParams)
                    .then(proxyRes => {
                        directUpload(url, filePath, formParams)
                            .then((directRes) => {
                                expect(isCommonResHeaderEqual(directRes.headers, proxyRes.headers, url)).toBe(true);
                                expect(isCommonReqEqual(url, serverInstance)).toBe(true);
                                assertReponse(proxyRes, directRes, filePath, done);
                            }, error => {
                                console.error('error in direct upload:', error);
                                done.fail('error in direct upload');
                            });
                    }, error => {
                        console.error('error in proxy upload:', error);
                        done.fail('error in proxy upload:');
                    });

            });

            it('PUT upload should be working', (done) => {
                const url = constructUrl('/test/upload/putpng');
                const filePath = path.resolve('./test/data/test.png');
                proxyPutUpload(url, filePath, formParams)
                    .then(proxyRes => {
                        directPutUpload(url, filePath, formParams)
                            .then((directRes) => {
                                expect(isCommonResHeaderEqual(directRes.headers, proxyRes.headers, url)).toBe(true);

                                assertReponse(proxyRes, directRes, filePath, done);
                            }, error => {
                                console.error('error in direct upload:', error);
                                done.fail('error in direct upload');
                            });
                    }, error => {
                        console.error('error in proxy upload:', error);
                        done.fail('error in proxy upload:');
                    });
            });

            function assertReponse (proxyRes, directRes, originFilePath, done) {
                expect(proxyRes.statusCode).toEqual(200);

                expect(proxyRes.statusCode).toEqual(directRes.statusCode);
                // expect(proxyRes.headers.reqbody).toEqual(directRes.headers.reqbody);

                // the body will be the file path
                const directUploadedStream = fs.createReadStream(directRes.body);
                const proxyUploadedStream = fs.createReadStream(proxyRes.body);
                const localFileStream = fs.createReadStream(originFilePath);
                streamEqual(directUploadedStream, localFileStream)
                    .then(isLocalEqual => {
                        expect(isLocalEqual).toBe(true);
                        streamEqual(directUploadedStream, proxyUploadedStream)
                            .then(isUploadedEqual => {
                                expect(isUploadedEqual).toBe(true);
                                done();
                            }, error => {
                                console.error('error in comparing directUpload with proxy:\n',error);
                                done.fail('error in comparing directUpload with proxy');
                            });
                        done();
                    }, error => {
                        console.error('error in comparing directUpload with local:\n',error);
                        done.fail('error in comparing directUpload with local');
                    });
            }
        });

        // describe('Test Big file download', () => {
        //     // const url = '/test/download/bigfile';
        //     const url = 'http://yunpan.alibaba-inc.com/downloadService.do?token=pZWiXMXUguIUQDvR098qnUVqVAWhNVY6';
        //     const contentType = 'application/octet-stream';
        //     const param = {};
        //     it('BIG file downlaod should be working', (done) => {
        //         directGet(url, param, CommonRequestHeader).then(proxyRes => {
        //             console.info('proxyRes body:', proxyRes.body);

        //             directGet(url, param, CommonRequestHeader).then(directRes => {
        //                 expect(proxyRes.statusCode).toEqual(200);
        //                 expect(proxyRes.headers['content-type']).toEqual(contentType);

        //                 expect(proxyRes.statusCode).toEqual(directRes.statusCode);
        //                 expect(proxyRes.headers['content-type']).toEqual(directRes.headers['content-type']);
        //                 expect(proxyRes.body).toEqual(directRes.body);
        //                 done();
        //             }, error => {
        //                 console.error('error in direct get bigfile :', error);
        //                 done.fail(`error happend in direct get bigfile`);
        //             });
        //         }, error => {
        //             console.error('error in proxy get bigfile :', error);
        //             done.fail(`error happend in proxy get bigfile`);
        //         });
        //     });
        // });
    });
}
