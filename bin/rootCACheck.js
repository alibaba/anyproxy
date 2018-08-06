/**
* check if root CA exists and installed
* will prompt to generate when needed
*/

const thunkify = require('thunkify');
const AnyProxy = require('../proxy');
const logUtil = require('../lib/log');

const certMgr = AnyProxy.utils.certMgr;

function checkRootCAExists() {
  return certMgr.isRootCAFileExists();
}

module.exports = function *() {
  try {
    if (!checkRootCAExists()) {
      logUtil.warn('Missing root CA, generating now');
      yield thunkify(certMgr.generateRootCA)();
      yield certMgr.trustRootCA();
    } else {
      const isCATrusted = yield thunkify(certMgr.ifRootCATrusted)();
      if (!isCATrusted) {
        logUtil.warn('ROOT CA NOT INSTALLED YET');
        yield certMgr.trustRootCA();
      }
    }
  } catch (e) {
    console.error(e);
  }
};

