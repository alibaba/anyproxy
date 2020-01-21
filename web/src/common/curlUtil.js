module.exports = {
  curlify(recordDetail) {
    const headers = { ...recordDetail.reqHeader };
    const acceptEncoding = headers['Accept-Encoding'] || headers['accept-encoding'];
    // escape reserve character in url
    const url = recordDetail.url.replace(/([\[\]])/g, '\\$1');
    const curlified = ['curl', `'${url}'`];

    if (recordDetail.method.toUpperCase() !== 'GET') {
      curlified.push('-X', recordDetail.method);
    }

    Object.keys(headers).forEach((key) => {
      curlified.push('-H', `'${key}: ${headers[key]}'`);
    });

    if (recordDetail.reqBody) {
      curlified.push('-d', `'${recordDetail.reqBody}'`);
    }

    if (/deflate|gzip/.test(acceptEncoding)) {
      curlified.push('--compressed');
    }

    return curlified.join(' ');
  }
};
