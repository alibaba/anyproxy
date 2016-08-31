/**
*
* The utility class for test
*/
const zlib = require('zlib');
const color = require('colorful');

/*
* Compare whether tow object are equal
*/
function isObjectEqual (source = {} , target = {}, url = '') {
    source = Object.assign({}, source);
    target = Object.assign({}, target);
    let isEqual = true;

    for(const key in source) {
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

    for(const key in target) {
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
function isCommonResHeaderEqual (directHeaders, proxyHeaders, requestUrl) {
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
    try{
        url = url.replace('https://', '').replace('http://', ''); // only the remained path is required
        let isEqual = true;

        const directReqObj = serverInstance.getRequestRecord(url);
        const proxyReqObj = serverInstance.getProxyRequestRecord(url);

        // ensure the proxy header is correct
        isEqual = isEqual && proxyReqObj.headers['via-proxy'] === 'true';
        delete proxyReqObj.headers['via-proxy'];

        // exclued accept-encoding from comparing, since the proxy will remove it before sending it out
        delete directReqObj.headers['accept-encoding'];

        // per undefined header, proxy will set it with 0, and an empty request body
        if (typeof directReqObj.headers['content-length'] === 'undefined') {

            directReqObj.headers['content-length'] = "0";
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
function trimFormContentType (contentType = '') {
    return contentType.replace(/boundary.*/, '');
}


function printLog (content) {
    console.log(color.blue('==LOG==: ' + content));
}

function printWarn(content) {
    console.log(color.magenta('==WARN==: ' + content));
}

function printError(content) {
    console.log(color.red('==ERROR==: ' + content));
}

module.exports = {
    isObjectEqual,
    isCommonResHeaderEqual,
    printLog,
    printWarn,
    printError,
    isCommonReqEqual
};
