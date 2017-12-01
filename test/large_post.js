const proxyTester = require('proxy-eval'),
  Buffer = require('buffer').Buffer,
  express = require('express');

const app = express();
 
app.post('/', (req, res) => {
  const bigBody = new Buffer(1024 * 1024 * 10);
  res.send(bigBody); //10 mb
});
app.listen(3000);

function test() {
  //test the basic availibility of proxy server
  setTimeout(() => {
    const testParam = {
      proxy: 'http://127.0.0.1:8001/',
      reqTimeout: 4500,
      httpGetUrl: '',
      httpPostUrl: 'http://127.0.0.1:3000/',
      httpPostBody: '123',
      httpsGetUrl: '',
      httpsPostUrl: '',
      httpsPostBody: ''
    };
    proxyTester.test(testParam, (results) => {
      process.exit();
    });
  }, 1000);
}

setTimeout(() => {
  test();
}, 3000);

