const WebInterface = require('../../lib/webInterface.js');
const Recorder = require('../../lib/recorder');
const { directGet } = require('../util/HttpUtil.js');

describe('WebInterface server', () => {
  let webServer = null;
  let webHost = 'http://127.0.0.1:8002';

  beforeAll(() => {
    const recorder = new Recorder();
    webServer = new WebInterface({
      webPort: 8002,
    }, recorder);
  });

  afterAll(() => {
    webServer.close();
  });

  it('should response qrcode string in /getQrCode', done => {
    directGet(`${webHost}/api/getQrCode`)
      .then(res => {
        const body = JSON.parse(res.body);
        expect(body.qrImgDom).toMatch('<img src="data:image/');
        expect(body.url).toBe(`${webHost}/downloadCrt`);
        done();
      })
      .catch(done);
  });
});