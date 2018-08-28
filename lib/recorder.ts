'use strict';

import * as Datastore from 'nedb';
import * as path from 'path';
import * as fs from 'fs';
import * as events from 'events';
import * as iconv from 'iconv-lite';
import * as fastJson from 'fast-json-stringify';
import logUtil from './log';
import proxyUtil from './util';

// //start recording and share a list when required
// const Datastore = require('nedb'),
//   path = require('path'),
//   fs = require('fs'),
//   logUtil = require('./log'),
//   events = require('events'),
//   iconv = require('iconv-lite'),
//   fastJson = require('fast-json-stringify'),
//   proxyUtil = require('./util').default;

declare interface ISingleRecord {
  _id?: number;
  id?: number;
  url?: string;
  host?: string;
  path?: string;
  method?: string;
  reqHeader?: OneLevelObjectType;
  startTime?: number;
  reqBody?: string;
  protocol?: string;
  statusCode?: number | string;
  endTime?: number | string;
  resHeader?: OneLevelObjectType;
  length?: number | string;
  mime?: string;
  duration?: number | string;
}


const wsMessageStingify = fastJson({
  title: 'ws message stringify',
  type: 'object',
  properties: {
    time: {
      type: 'integer',
    },
    message: {
      type: 'string',
    },
    isToServer: {
      type: 'boolean',
    },
  },
});

const BODY_FILE_PRFIX = 'res_body_';
const WS_MESSAGE_FILE_PRFIX = 'ws_message_';
const CACHE_DIR_PREFIX = 'cache_r';
function getCacheDir(): string {
  const rand = Math.floor(Math.random() * 1000000);
  const cachePath = path.join(proxyUtil.getAnyProxyPath('cache'), './' + CACHE_DIR_PREFIX + rand);

  fs.mkdirSync(cachePath);
  return cachePath;
}

function normalizeInfo(id: number, info: AnyProxyRecorder.ResourceInfo): ISingleRecord {
  const singleRecord: ISingleRecord = {};

  // general
  singleRecord._id = id;
  singleRecord.id = id;
  singleRecord.url = info.url;
  singleRecord.host = info.host;
  singleRecord.path = info.path;
  singleRecord.method = info.method;

  // req
  singleRecord.reqHeader = info.req.headers;
  singleRecord.startTime = info.startTime;
  singleRecord.reqBody = info.reqBody || '';
  singleRecord.protocol = info.protocol || '';

  // res
  if (info.endTime) {
    singleRecord.statusCode = info.statusCode;
    singleRecord.endTime = info.endTime;
    singleRecord.resHeader = info.resHeader;
    singleRecord.length = info.length;
    const contentType = info.resHeader['content-type'] || info.resHeader['Content-Type'];
    if (contentType) {
      singleRecord.mime = contentType.split(';')[0];
    } else {
      singleRecord.mime = '';
    }

    singleRecord.duration = info.endTime - info.startTime;
  } else {
    singleRecord.statusCode = '';
    singleRecord.endTime = '';
    singleRecord.resHeader = {};
    singleRecord.length = '';
    singleRecord.mime = '';
    singleRecord.duration = '';
  }

  return singleRecord;
}

class Recorder extends events.EventEmitter {
  private globalId: number;
  private cachePath: string;
  private db: Datastore;
  constructor() {
    super();
    this.globalId = 1;
    this.cachePath = getCacheDir();
    this.db = new Datastore();
    this.db.persistence.setAutocompactionInterval(5001);

    // this.recordBodyMap = [];  // id - body
  }

  public emitUpdate(id: number, info?: ISingleRecord): void {
    const self = this;
    if (info) {
      self.emit('update', info);
    } else {
      self.getSingleRecord(id, (err, doc) => {
        if (!err && !!doc && !!doc[0]) {
          self.emit('update', doc[0]);
        }
      });
    }
  }

  public emitUpdateLatestWsMessage(id: number, message: {
    id: number,
    message: AnyProxyRecorder.WsResourceInfo,
  }): void {
    this.emit('updateLatestWsMsg', message);
  }

  public updateRecord(id: number, info: AnyProxyRecorder.ResourceInfo): void {
    if (id < 0) {
      return;
    }
    const self = this;
    const db = self.db;

    const finalInfo = normalizeInfo(id, info);

    db.update({ _id: id }, finalInfo);
    self.updateRecordBody(id, info);

    self.emitUpdate(id, finalInfo);
  }

  /**
  * This method shall be called at each time there are new message
  *
  */
  public updateRecordWsMessage(id: number, message: AnyProxyRecorder.WsResourceInfo): void {
    const cachePath = this.cachePath;
    if (id < 0) {
      return;
    }
    try {
      const recordWsMessageFile = path.join(cachePath, WS_MESSAGE_FILE_PRFIX + id);

      fs.appendFile(recordWsMessageFile, wsMessageStingify(message) + ',', (err) => {
        if (err) {
          logUtil.error(err.message);
        }
      });
    } catch (e) {
      console.error(e);
      logUtil.error(e.message + e.stack);
    }

    this.emitUpdateLatestWsMessage(id, {
      id,
      message,
    });
  }

  // public updateExtInfo(id: number , extInfo: any): void {
  //   const self = this;
  //   const db = self.db;

  //   db.update({ _id: id }, { $set: { ext: extInfo } }, {}, (err, nums) => {
  //     if (!err) {
  //       self.emitUpdate(id);
  //     }
  //   });
  // }

  public appendRecord(info: AnyProxyRecorder.ResourceInfo): number {
    if (info.req.headers.anyproxy_web_req) { // TODO request from web interface
      return -1;
    }
    const self = this;
    const db = self.db;

    const thisId = self.globalId++;
    const finalInfo = normalizeInfo(thisId, info);
    db.insert(finalInfo);
    self.updateRecordBody(thisId, info);

    self.emitUpdate(thisId, finalInfo);
    return thisId;
  }

  public updateRecordBody(id: number, info: AnyProxyRecorder.ResourceInfo): void {
    const self = this;
    const cachePath = self.cachePath;

    if (id === -1) {
      return;
    }

    if (!id || typeof info.resBody === 'undefined') {
      return;
    }
    // add to body map
    // ignore image data
    const bodyFile = path.join(cachePath, BODY_FILE_PRFIX + id);
    fs.writeFile(bodyFile, info.resBody, (err) => {
      if (err) {
        logUtil.error(err.name);
      }
    });
  }

  /**
  * get body and websocket file
  *
  */
  public getBody(id: number, cb: (err: Error, content?: Buffer | string) => void): void {
    const self = this;
    const cachePath = self.cachePath;

    if (id < 0) {
      cb && cb(null, '');
    }

    const bodyFile = path.join(cachePath, BODY_FILE_PRFIX + id);
    // node exported the `constants` from fs to maintain all the state constans since V7
    // but the property `constants` does not exists in versions below 7, so we keep the way
    fs.access(bodyFile, (fs as any).F_OK || (fs as any).R_OK, (err) => {
      if (err) {
        cb && cb(err);
      } else {
        fs.readFile(bodyFile, cb);
      }
    });
  }

  public getDecodedBody(id: number, cb: (err: Error, result?: {
    method?: string;
    type?: string;
    mime?: string;
    content?: string;
    fileName?: string;
    statusCode?: number;
  }) => void): void {
    const self = this;
    const result = {
      method: '',
      type: 'unknown',
      mime: '',
      content: '',
      fileName: undefined,
      statusCode: undefined,
    };
    self.getSingleRecord(id, (err, doc) => {
      // check whether this record exists
      if (!doc || !doc[0]) {
        cb(new Error('failed to find record for this id'));
        return;
      }

      // also put the `method` back, so the client can decide whether to load ws messages
      result.method = doc[0].method;

      self.getBody(id, (error, bodyContent) => {
        if (error) {
          cb(error);
        } else if (!bodyContent) {
          cb(null, result);
        } else {
          const record = doc[0];
          const resHeader = record.resHeader || {};
          try {
            const headerStr = JSON.stringify(resHeader);
            const  charsetMatch = headerStr.match(/charset='?([a-zA-Z0-9-]+)'?/);
            const contentType = resHeader && (resHeader['content-type'] || resHeader['Content-Type']);

            if (charsetMatch && charsetMatch.length) {
              const currentCharset = charsetMatch[1].toLowerCase();
              if (currentCharset !== 'utf-8' && iconv.encodingExists(currentCharset)) {
                result.content = iconv.decode((bodyContent as Buffer), currentCharset);
              } else {
                result.content = bodyContent.toString();
              }

              result.mime = contentType;
              result.type = contentType && /application\/json/i.test(contentType) ? 'json' : 'text';
            } else if (contentType && /image/i.test(contentType)) {
              result.type = 'image';
              result.mime = contentType;
              result.content = (bodyContent as string);
            } else {
              result.type = contentType;
              result.mime = contentType;
              result.content = bodyContent.toString();
            }
            result.fileName = path.basename(record.path);
            result.statusCode = record.statusCode;
          } catch (e) {
            console.error(e);
          }
          cb(null, result);
        }
      });
    });
  }

  /**
  * get decoded WebSoket messages
  *
  */
  public getDecodedWsMessage(id: number, cb: (err: Error, messages?: AnyProxyRecorder.WsResourceInfo[]) => void): void {
    const self = this;
    const cachePath = self.cachePath;

    if (id < 0) {
      cb && cb(null, []);
    }

    const wsMessageFile = path.join(cachePath, WS_MESSAGE_FILE_PRFIX + id);
    fs.access(wsMessageFile, (fs as any).F_OK || (fs as any).R_OK, (err) => {
      if (err) {
        cb && cb(err);
      } else {
        fs.readFile(wsMessageFile, 'utf8', (error, content) => {
          if (error) {
            cb && cb(err);
          }

          try {
            // remove the last dash "," if it has, since it's redundant
            // and also add brackets to make it a complete JSON structure
            content = `[${content.replace(/,$/, '')}]`;
            const messages = JSON.parse(content);
            cb(null, messages);
          } catch (e) {
            console.error(e);
            logUtil.error(e.message + e.stack);
            cb(e);
          }
        });
      }
    });
  }

  public getSingleRecord(id: number, cb: (err: Error, result: ISingleRecord) => void): void {
    const self = this;
    const db = self.db;
    db.find({ _id: id }, cb);
  }

  public getSummaryList(cb: (err: Error, records: ISingleRecord[]) => void): void {
    const self = this;
    const db = self.db;
    db.find({}, cb);
  }

  public getRecords(idStart: number | string, limit: number, cb: (err: Error, records: ISingleRecord[]) => void): void {
    const self = this;
    const db = self.db;
    limit = limit || 10;
    idStart = typeof idStart === 'number' ? idStart : (self.globalId - limit);
    db.find({ _id: { $gte: idStart } })
      .sort({ _id: 1 })
      .limit(limit)
      .exec(cb);
  }

  public clear(): void {
    const self = this;
    proxyUtil.deleteFolderContentsRecursive(self.cachePath, true);
  }
}

export default Recorder;
