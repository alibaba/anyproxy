/**
* a util to set and get all configuable constant
*
*/
const path = require('path');

const USER_HOME = process.env.HOME || process.env.USERPROFILE;
const DEFAULT_ANYPROXY_HOME = path.join(USER_HOME, '/.anyproxy/');

/**
* return AnyProxy's home path
*/
module.exports.getAnyProxyHome = function () {
  const ENV_ANYPROXY_HOME = process.env.ANYPROXY_HOME || '';
  return ENV_ANYPROXY_HOME || DEFAULT_ANYPROXY_HOME;
}
