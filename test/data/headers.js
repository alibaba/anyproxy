/*
* 用于放置所有header信息的测试数据
*
*/

// Get 和 Post共有的header信息
/*eslint max-len: ["off"]*/
const CommonRequestHeader = {
  Accept: 'application/json;charset=utf-8,text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Charset': 'utf-8',
  'Accept-Encoding': 'gzip, deflate',
  'Accept-Language': 'zh-CN',
  'Accept-Datetime': 'Thu, 31 May 2007 20:35:00 GMT',
  Authorization: 'Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==',
  'Cache-Control': 'no-cache',
  Connection: 'keep-alive',
  Cookie: 'testCookie1=cookie1; testCookie2=cookie2',
  'Content-Type': 'application/x-www-form-urlencoded',
  Date: 'Tue, 15 Nov 1994 08:12:31 GMT',
  Origin: 'http://localhost',
  Pragma: 'no-cache',
  some_thing: 'only_to_test_letter_case',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36'
};

module.exports = {
  CommonRequestHeader
};

