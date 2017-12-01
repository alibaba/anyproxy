const Jasmine = require('jasmine');

const jasmine = new Jasmine();
const util = require('./lib/util');
const path = require('path');

const testTmpPath = path.join(__dirname, './test/temp');
const configFilePath = path.join(__dirname, './test/jasmine.json');
// rm - rf./test / temp /
util.deleteFolderContentsRecursive(testTmpPath);

jasmine.loadConfigFile(configFilePath);
jasmine.configureDefaultReporter({
  showColors: false
});
jasmine.execute();
