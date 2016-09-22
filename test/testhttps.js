const request = require('request');
const { directGet } = require('./util/HttpUtil.js');
const https = require('https');
// https.globalAgent.maxCachedSessions = 0;

const options = {
    hostname: 'weixin.qq.com',
    method: 'GET',
    path: '/zh_CN/htmledition/js/qmtool0cae9c.js'
};


// const url1 = 'https://weixin.qq.com/zh_CN/htmledition/js/qmtool0cae9c.js';
const url1 = 'https://camo.githubusercontent.com/8d44df6ff63d2d5fec8336f688f5212dc5354fdb/68747470733a2f2f742e616c697061796f626a656374732e636f6d2f746673636f6d2f54314e774666586e306f58585858585858582e6a70675f343030782e6a7067'
const url2 = 'https://ss1.bdstatic.com/5eN1bjq8AAUYm2zgoY3K/r/www/cache/static/protocol/https/soutu/css/soutu_bff2306f.css';
const url11 = 'https://weixin.qq.com/zh_CN/htmledition/js/qmtool0cae9c.js';


require('http').get(options, function(res) {
    // res.pipe(process.stdout);

    res.on('data', () => {
        console.info('on res1 data');
    });

    res.on('end', () => {
        console.info('header in res1 is: ', res.headers);

        // require('https').get(options, function(res2) {
        //     // res2.pipe(process.stdout);
        //     res2.on('data', (data) =>{
        //         // console.info('data2 received:', data);
        //     });

        //     res2.on('end', () => {
        //         console.info('\nheader in res2 is: ', res2.headers);
        //     });
        // });
    });


});


// require('tls').connect(443, 'weixin.qq.com', function () {
//     this.write('GET / HTTP/1.0\r\nHost: weixin.qq.com\r\n\r\n');
//     this.pipe(process.stdout);
//     require('tls').connect(443, 'weixin.qq.com', function () {
//         this.write('GET / HTTP/1.0\r\nHost: weixin.qq.com\r\n\r\n');
//         this.pipe(process.stdout);
//     });

// })



const requestData = {
    method: 'GET',
    form: {},
    url: 'https://weixin.qq.com/zh_CN/htmledition/js/qmtool0cae9c.js',
    headers: options.headers,
    forever: false,
    secureProtocol: 'SSLv3_method',
    rejectUnauthorized: false
};

// request(
//     requestData,
//     function(error, response, body) {
//         if (error) {
//             console.error(error);
//             return;
//         }
//         console.info('success in request');
//     }
// );

const getParam = {
    param: 'nothing'
};

// directGet(url1, getParam, {}).then((proxyRes) => {
//     console.info('resheader: ', proxyRes.headers);
//     console.info('success in direget get1');
//     directGet(url1, getParam, {}).then((res2) => {
//         console.info('\nsuccess in direget get2', res2.headers);
//     }, (error) => {
//         console.error('error in get 2', error)
//     });
// });

