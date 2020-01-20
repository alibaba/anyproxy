const WebInterface = require('../../lib/webInterface.js');
const Recorder = require('../../lib/recorder');
const urllib = require('urllib');

describe('WebInterface server', () => {
  let webServer = null;
  const webHost = 'http://127.0.0.1:8002'

  beforeAll(async () => {
    const recorder = new Recorder();
    webServer = new WebInterface({
      webPort: 8002,
    }, recorder);
    await webServer.start();
  });

  afterAll(async () => {
    await webServer.close();
  });

  it('should response qrcode string in /getQrCode', async () => {
    const response = await urllib.request(`${webHost}/api/getQrCode`);
    const body = JSON.parse(response.res.data);
    expect(body.qrImgDom).toMatch('<img src="data:image/');
    expect(body.url).toBe(`${webHost}/downloadCrt`);
  });
});
