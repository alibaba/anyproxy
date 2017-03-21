/**
*
* The utility class for test
*/
const color = require('colorful');
const simhash = require('node-simhash');
/*
* Compare whether tow object are equal
*/
function isObjectEqual(source = {}, target = {}, url = '') {
  source = Object.assign({}, source);
  target = Object.assign({}, target);
  let isEqual = true;

  for (const key in source) {
    isEqual = isEqual && source[key] === target[key];

    if (!isEqual) {
      console.info('source object :', source);
      console.info('target object :', target);
      printError(`different key in isObjectEqual is: "${key}", source is "${source[key]}",
        target is "${target[key]}" the url is ${url}`);
      break;
    }

    delete source[key];
    delete target[key];
  }

  for (const key in target) {
    isEqual = isEqual && source[key] === target[key];

    if (!isEqual) {
      console.info('source object :', source);
      console.info('target object :', target);
      printError(`different key in isObjectEqual is: "${key}", source is "${source[key]}",
        target is "${target[key]}" the url is ${url}`);
      break;
    }

    delete source[key];
    delete target[key];
  }

  return isEqual;
}

/*
* Compare the header between direct with proxy
* Will exclude the header(s) which modified by proxy
*/
function isCommonResHeaderEqual(directHeaders, proxyHeaders, requestUrl) {
  directHeaders = Object.assign({}, directHeaders);
  proxyHeaders = Object.assign({}, proxyHeaders);
  let isEqual = true;
  const mustEqualFileds = []; // the fileds that have to be equal, or the assert will be failed

  if (!/gzip/i.test(directHeaders['content-encoding'])) {
    // if the content is gzipped, proxy will unzip and remove the header
    mustEqualFileds.push('content-encoding');
    mustEqualFileds.push('content-length');
  }
  mustEqualFileds.push('content-type');
  mustEqualFileds.push('cache-control');
  mustEqualFileds.push('allow');

  // ensure the required fileds are same
  mustEqualFileds.forEach(filedName => {
    isEqual = directHeaders[filedName] === proxyHeaders[filedName];
    delete directHeaders[filedName];
    delete proxyHeaders[filedName];
  });

  // remained filed are good to be same, but are allowed to be different
  // will warn out those different fileds
  for (const key in directHeaders) {
    if (directHeaders[key] !== proxyHeaders[key]) {
      printWarn(`key "${key}" of two response headers are different in request "${requestUrl}" :
       direct is: "${directHeaders[key]}", proxy is: "${proxyHeaders[key]}"`);
    }
    continue;
  }

  return isEqual;
}

/*
* Compare the request between direct with proxy
*
*/
function isCommonReqEqual(url, serverInstance) {
  try {
    let isEqual = true;

    const directReqObj = serverInstance.getRequestRecord(url);
    const proxyReqObj = serverInstance.getProxyRequestRecord(url);

    // ensure the proxy header is correct
    isEqual = isEqual && proxyReqObj.headers['via-proxy'] === 'true';
    delete proxyReqObj.headers['via-proxy'];

    // exclued accept-encoding from comparing, since the proxy will remove it before sending it out
    delete directReqObj.headers['accept-encoding'];

    // TODO: 我这里proxy出去的options里没有accept-encoding, 但node自己加上了。Why ?
    // By 加里 2017.1.31
    delete proxyReqObj.headers['accept-encoding'];

    // TODO: 有些content-length比对也会有问题，direct出去的有时没有。后面临时加个判断，需要细查
    if (typeof directReqObj.headers['content-length'] === 'undefined' && proxyReqObj.headers['content-length']) {
      directReqObj.headers['content-length'] = '0';
    }

    directReqObj.headers['content-type'] = trimFormContentType(directReqObj.headers['content-type']);
    proxyReqObj.headers['content-type'] = trimFormContentType(proxyReqObj.headers['content-type']);

    isEqual = isEqual && directReqObj.url === proxyReqObj.url;
    isEqual = isEqual && isObjectEqual(directReqObj.headers, proxyReqObj.headers, url);
    isEqual = isEqual && directReqObj.body === proxyReqObj.body;
    return isEqual;
  } catch (e) {
    console.error(e);
  }
}

/*
* for multipart-form, the boundary will be different with each update, we trim it here
*/
function trimFormContentType(contentType = '') {
  return contentType.replace(/boundary.*/, '');
}


function printLog(content) {
  console.log(color.blue('==LOG==: ' + content));
}

function printWarn(content) {
  console.log(color.magenta('==WARN==: ' + content));
}

function printError(content) {
  console.log(color.red('==ERROR==: ' + content));
}

function printHilite(content) {
  console.log(color.yellow('==LOG==: ' + content));
}

function parseUrlQuery(string = '') {
  const parameterArray = string.split('&');
  const parsedObj = {};
  parameterArray.forEach((parameter) => {
    // 获取等号的位置
    const indexOfEqual = parameter.indexOf('=');
    const name = parameter.substr(0, indexOfEqual);
    const value = parameter.substr(indexOfEqual + 1);
    parsedObj[name] = value;
  });
  return parsedObj;
}

function stringSimilarity(a, b, precision = 2) {
  let similarity = '0%';
  let isCongruent = false;
  if (a && b) {
    const targetLen = Math.max(a.length, b.length);
    targetLen > 1000 ?
      similarity = simHasH(a, b) :
      similarity = LevenshteinSimilarity(a, b);
    isCongruent = similarity === 100;
    similarity = similarity.toFixed(precision) + '%';
  }
  return {
    isCongruent,
    similarity
  }
}

/**
* simhash similarity
*/
function simHasH(a, b) {
  return (simhash.compare(a, b) * 100);
}

/**
* Levenshtein Distance
*/
function LevenshteinSimilarity(a, b) {
  let cost;
  const maxLen = Math.max(a.length, b.length);
  const minOfThree = (numa, numb, numc) => {
    if (numa > numb) {
      return numb > numc ? numc : numb;
    } else {
      return numa > numc ? numc : numa;
    }
  }
  if (a.length === 0) cost = b.length;
  if (b.length === 0) cost = a.length;

  if (a.length > b.length) {
    const tmp = a;
    a = b;
    b = tmp;
  }

  const row = [];
  for (let i = 0; i <= a.length; i++) {
    row[i] = i;
  }

  for (let i = 1; i <= b.length; i++) {
    let prev = i;
    for (let j = 1; j <= a.length; j++) {
      let val;
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        val = row[j - 1];
      } else {
        val = minOfThree(row[j - 1] + 1, prev + 1, row[j] + 1);
      }
      row[j - 1] = prev;
      prev = val;
    }
    row[a.length] = prev;
  }
  cost = row[a.length];
  return ((maxLen - cost) / maxLen * 100);
}

module.exports = {
  isObjectEqual,
  isCommonResHeaderEqual,
  printLog,
  printWarn,
  printError,
  printHilite,
  isCommonReqEqual,
  parseUrlQuery,
  stringSimilarity
};
