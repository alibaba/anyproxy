
/**
 * use phantomjs to capture requests in real websites, then compare the directly-connected response with those through AnyProxy
 */
const fs = require('fs');
const ProxyServerUtil = require('../util/ProxyServerUtil.js');
const HttpUtil = require('../util/HttpUtil.js');
const path = require('path');
const { printLog, printError, printHilite, stringSimilarity } = require('../util/CommonUtil.js');

const reportPath = path.join(__dirname, '../report/');

const testUrls = ['https://www.taobao.com', 'https://www.baidu.com', 'https://www.tmall.com'];

let direcrtResponseSampleA = [];
let direcrtResponseSampleB = [];
let proxyResponse = [];

function test(url, requestHeaders = {}) {
  describe('Test requests in real broswer', () => {
    let proxyServer;

    beforeAll((done) => {
      jasmine.DEFAULT_TIMEOUT_INTERVAL = 200000;
      printLog('Start server for ' + url);

      proxyServer = ProxyServerUtil.defaultProxyServer();
      setTimeout(() => {
        done();
      }, 2000);
    });

    afterAll(() => {
      proxyServer && proxyServer.close();
      printLog('Closed server for ' + url);
    });

    it(`Request towards ${url}`, (done) => {
      HttpUtil.getRequestListFromPage(url).then((arr) => {
        const directPromisesA = [];
        const directPromisesB = [];
        const proxyPromises = [];
        arr.forEach((data, i) => {
          const requestPath = data.url;
          const headers = data.headers;
          const method = data.method;
          const params = data.method === 'POST' ? JSON.parse(data.postData) : {};
          if (HttpUtil.isSupportedProtocol(requestPath)) {
            directPromisesA.push(HttpUtil.directRequest(method, requestPath, params, headers));
            directPromisesB.push(HttpUtil.directRequest(method, requestPath, params, headers));
            proxyPromises.push(HttpUtil.proxyRequest(method, requestPath, params, headers));
          }
        });
        Promise.all(directPromisesA).then(responseArr => { direcrtResponseSampleA = responseArr }).then(() => {
          Promise.all(directPromisesB).then(responseArr => { direcrtResponseSampleB = responseArr }).then(() => {
            Promise.all(proxyPromises).then(responseArr => { proxyResponse = responseArr }).then(() => {
              showResponseResult();
              const { compareResult: TESTRESULT, errRecord } = compareResponses(url);
              const reportFile = dealLogFile(errRecord, url, () => {
                printHilite('======  COMPARE RESULT: ' + TESTRESULT.toString().toUpperCase() + '  ======');
                !TESTRESULT && printHilite(`Check more details in ${reportFile}`);
                // expect(TESTRESULT).toBe(true);
                done();
              });
            })
            .catch((err) => {
              printError(err);
              done();
            });
          })
          .catch((err) => {
            printError(err);
            done();
          });
        })
        .catch((err) => {
          printError(err);
          done();
        });
      });
    })
  })
}

function compareResponses(curUrl) {
  const errRecord = [];
  if (direcrtResponseSampleA.length !== direcrtResponseSampleB.length || direcrtResponseSampleA.length !== proxyResponse.length) {
    printError('compare fail: length not match');
    return {
      compareResult: false,
      errRecord
    }
  }
  for (let i = 0; i < proxyResponse.length; i++) {
    const direcrtResponseInfoA = direcrtResponseSampleA[i];
    const direcrtResponseInfoB = direcrtResponseSampleB[i];
    const proxyResponseInfo = proxyResponse[i];
    const { similarity: similarity_direct } = stringSimilarity(stringify(direcrtResponseInfoA.body), stringify(direcrtResponseInfoB.body));
    const { similarity: similarity_proxy } = stringSimilarity(stringify(direcrtResponseInfoA.body), stringify(proxyResponseInfo.body));
    if (similarity_direct !== similarity_proxy) {
      let LogText = `Similarity from ${proxyResponseInfo.request.href} between direct samples and proxy is not equal : ${similarity_direct} | ${similarity_proxy}\n`;
      printError(LogText);
      LogText += `\n${stringify(direcrtResponseInfoA.body)}`;
      LogText += '\n=============================================\n';
      LogText += `${stringify(direcrtResponseInfoB.body)}`;
      LogText += '\n=============================================\n';
      LogText += `${stringify(proxyResponseInfo.body)}\n\n`;
      errRecord.push(LogText);
    }
  }
  return {
    compareResult: errRecord.length === 0,
    errRecord
  };
}

function stringify(data) {
  return data ? data.replace(/\s+/g, '') : '';
}

function showResponseResult() {
  if (direcrtResponseSampleA.length !== direcrtResponseSampleB.length || direcrtResponseSampleA.length !== proxyResponse.length) {
    printError('compare fail: length not match');
  }
  proxyResponse.forEach((dataObj, i) => {
    const direcrtResponseInfoA = direcrtResponseSampleA[i];
    const direcrtResponseInfoB = direcrtResponseSampleB[i];
    printLog(`Direct Sample A ${direcrtResponseInfoA.request.method}: ${direcrtResponseInfoA.request.href} ${direcrtResponseInfoA.statusCode}${direcrtResponseInfoA.statusMessage}`);
    printLog(`Direct Sample B ${direcrtResponseInfoB.request.method}: ${direcrtResponseInfoB.request.href} ${direcrtResponseInfoB.statusCode}${direcrtResponseInfoB.statusMessage}`);
    printLog(`PROXY ${dataObj.request.method}: ${dataObj.request.href} ${dataObj.statusCode}${dataObj.statusMessage}`);
  })
  console.log('\n');
}

function dealLogFile(dataObj = 'Log', url, cb) {
  const filePath = reportPath + url.replace(/[^\u4E00-\u9FA5A-Za-z\s()（）\d•·]/g, '_') + '.txt';
  fs.writeFile(filePath, dataObj, (err) => {
    if (err) throw err;
    console.log('Log is saved!');
    cb && cb();
  });
  return filePath;
}

testUrls.forEach((link) => {
  test(link);
});
