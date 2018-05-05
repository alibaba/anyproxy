
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const NoRuleSpecExec = require('./no_rule_spec_exec');
const ProxyServerUtil = require('../util/ProxyServerUtil.js');
const { printLog } = require('../util/CommonUtil.js');

const getStartProxyFunc = function (needWeb) {
  return function () {
    printLog('Start AnyProxy by node module');
    return ProxyServerUtil.defaultProxyServer(needWeb);
  }
}

const closeProxyFunc = function (instance) {
  printLog('Close AnyProxy by node module');
  instance.close();
}

testRequest();
testRequest(false);

function testRequest(needWeb = true) {
  NoRuleSpecExec(getStartProxyFunc(needWeb), closeProxyFunc);
}
