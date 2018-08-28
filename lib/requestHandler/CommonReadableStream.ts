import * as stream from 'stream';
const Readable = stream.Readable;
const DEFAULT_CHUNK_COLLECT_THRESHOLD = 20 * 1024 * 1024; // about 20 mb

/* tslint:disable:no-empty */
class CommonReadableStream extends Readable {
  constructor() {
    super({
      highWaterMark: DEFAULT_CHUNK_COLLECT_THRESHOLD * 5,
    });
  }
  public _read(): void {

  }
}

export default CommonReadableStream;
