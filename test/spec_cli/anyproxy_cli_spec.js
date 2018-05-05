'use strict';

const path = require('path');
const spawn = require('child_process').spawn;
const NoRuleSpecExec = require('../spec_rule/no_rule_spec_exec');
const { printLog } = require('../util/CommonUtil.js');
const pkg = require('../../package');

const binFile = path.resolve(pkg.bin.anyproxy);

const startProxyFunc = function () {
  printLog('Start AnyProxy by cli');
  const childProcessInstance = spawn(binFile, ['-i'], {});
  printLog('Start AnyProxy by cli successfully');
  return childProcessInstance;
}

const closeProxyFunc = function (instance) {
  printLog('Close AnyProxy in cli');
  instance.kill('SIGINT');
}

function testRequestByCli() {
  NoRuleSpecExec(startProxyFunc, closeProxyFunc);
}

testRequestByCli();
