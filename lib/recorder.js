'use strict'

//start recording and share a list when required
const Datastore = require('nedb'),
  path = require('path'),
  fs = require('fs'),
  events = require('events'),
  iconv = require('iconv-lite'),
  proxyUtil = require('./util');

const BODY_FILE_PRFIX = 'res_body_';
const CACHE_DIR_PREFIX = 'cache_r';
function getCacheDir() {
  const rand = Math.floor(Math.random() * 1000000),
    cachePath = path.join(proxyUtil.getAnyProxyPath('cache'), './' + CACHE_DIR_PREFIX + rand);

  fs.mkdirSync(cachePath);
  return cachePath;
}

function normalizeInfo(id, info) {
  const singleRecord = {};

  //general
  singleRecord._id = id;
  singleRecord.id = id;
  singleRecord.url = info.url;
  singleRecord.host = info.host;
  singleRecord.path = info.path;
  singleRecord.method = info.method;

  //req
  singleRecord.reqHeader = info.req.headers;
  singleRecord.startTime = info.startTime;
  singleRecord.reqBody = info.reqBody || '';
  singleRecord.protocol = info.protocol || '';

  //res
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
    singleRecord.resHeader = '';
    singleRecord.length = '';
    singleRecord.mime = '';
    singleRecord.duration = '';
  }

  return singleRecord;
}

class Recorder extends events.EventEmitter {
  constructor(config) {
    super(config);
    this.globalId = 1;
    this.cachePath = getCacheDir();
    this.db = new Datastore();
    this.db.persistence.setAutocompactionInterval(5001);

    this.recordBodyMap = [];  // id - body
  }

  emitUpdate(id, info) {
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

  updateRecord(id, info) {
    if (id < 0) return;
    const self = this;
    const db = self.db;

    const finalInfo = normalizeInfo(id, info);

    db.update({ _id: id }, finalInfo);
    self.updateRecordBody(id, info);

    self.emitUpdate(id, finalInfo);
  }

  updateExtInfo(id, extInfo) {
    const self = this;
    const db = self.db;

    db.update({ _id: id }, { $set: { ext: extInfo } }, {}, (err, nums) => {
      if (!err) {
        self.emitUpdate(id);
      }
    });
  }

  appendRecord(info) {
    if (info.req.headers.anyproxy_web_req) { //TODO request from web interface
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

  updateRecordBody(id, info) {
    const self = this;
    const cachePath = self.cachePath;

    if (id === -1) return;

    if (!id || typeof info.resBody === 'undefined') return;
    //add to body map
    //ignore image data
    const bodyFile = path.join(cachePath, BODY_FILE_PRFIX + id);
    fs.writeFile(bodyFile, info.resBody, () => {});
  }

  getBody(id, cb) {
    const self = this;
    const cachePath = self.cachePath;

    if (id < 0) {
      cb && cb('');
    }

    const bodyFile = path.join(cachePath, BODY_FILE_PRFIX + id);
    fs.access(bodyFile, fs.F_OK || fs.R_OK, (err) => {
      if (err) {
        cb && cb(err);
      } else {
        fs.readFile(bodyFile, cb);
      }
    });
  }

  getDecodedBody(id, cb) {
    const self = this;
    const result = {
      type: 'unknown',
      mime: '',
      content: ''
    };
    self.getSingleRecord(id, (err, doc) => {
      //check whether this record exists
      if (!doc || !doc[0]) {
        cb(new Error('failed to find record for this id'));
        return;
      }

      self.getBody(id, (error, bodyContent) => {
        if (error) {
          cb(error);
        } else if (!bodyContent) {
          cb(null, result);
        } else {
          const record = doc[0],
            resHeader = record.resHeader || {};
          try {
            const headerStr = JSON.stringify(resHeader),
              charsetMatch = headerStr.match(/charset='?([a-zA-Z0-9-]+)'?/),
              contentType = resHeader && (resHeader['content-type'] || resHeader['Content-Type']);

            if (charsetMatch && charsetMatch.length) {
              const currentCharset = charsetMatch[1].toLowerCase();
              if (currentCharset !== 'utf-8' && iconv.encodingExists(currentCharset)) {
                bodyContent = iconv.decode(bodyContent, currentCharset);
              }

              result.mime = contentType;
              result.content = bodyContent.toString();
              result.type = contentType && /application\/json/i.test(contentType) ? 'json' : 'text';
            } else if (contentType && /image/i.test(contentType)) {
              result.type = 'image';
              result.mime = contentType;
              result.content = bodyContent;
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

  getSingleRecord(id, cb) {
    const self = this;
    const db = self.db;
    db.find({ _id: parseInt(id, 10) }, cb);
  }

  getSummaryList(cb) {
    const self = this;
    const db = self.db;
    db.find({}, cb);
  }

  getRecords(idStart, limit, cb) {
    const self = this;
    const db = self.db;
    limit = limit || 10;
    idStart = typeof idStart === 'number' ? idStart : (self.globalId - limit);
    db.find({ _id: { $gte: parseInt(idStart, 10) } })
      .sort({ _id: 1 })
      .limit(limit)
      .exec(cb);
  }

  clear() {
    const self = this;
    proxyUtil.deleteFolderContentsRecursive(self.cachePath, true);
  }
}

module.exports = Recorder;
