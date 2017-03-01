'use strict'

//start recording and share a list when required
const Datastore = require('nedb'),
  util = require('util'),
  path = require('path'),
  fs = require('fs'),
  events = require('events'),
  iconv = require('iconv-lite'),
  proxyUtil = require('./util'),
  logUtil = require('./log');

const CACHE_DIR_PREFIX = 'cache_r';
const DB_FILE_NAME = 'anyproxy_db';
function getCacheDir() {
  const rand = Math.floor(Math.random() * 1000000),
    cachePath = path.join(proxyUtil.getAnyProxyPath('cache'), './' + CACHE_DIR_PREFIX + rand);

  fs.mkdirSync(cachePath);
  return cachePath;
}

//option.filename
function Recorder() {
  const self = this,
    cachePath = getCacheDir();
  let globalId = 1;
  let db;

  try {
    const dbFilePath = path.join(cachePath, DB_FILE_NAME);
    fs.writeFileSync(dbFilePath, '');

    db = new Datastore({
      filename: dbFilePath,
      autoload: true
    });
    db.persistence.setAutocompactionInterval(5001);
  } catch (e) {
    logUtil.printLog(e, logUtil.T_ERR);
    logUtil.printLog('Failed to load on-disk db file. Will use in-meomory db instead.', logUtil.T_ERR);
    db = new Datastore();
  }

  self.recordBodyMap = []; // id - body

  self.emitUpdate = function (id, info) {
    if (info) {
      self.emit('update', info);
    } else {
      self.getSingleRecord(id, (err, doc) => {
        if (!err && !!doc && !!doc[0]) {
          self.emit('update', doc[0]);
        }
      });
    }
  };

  self.updateRecord = function (id, info) {
    if (id < 0) return;

    const finalInfo = normalizeInfo(id, info);

    db.update({ _id: id }, finalInfo);
    self.updateRecordBody(id, info);

    self.emitUpdate(id, finalInfo);
  };

  self.updateExtInfo = function (id, extInfo) {
    db.update({ _id: id }, { $set: { ext: extInfo } }, {}, (err, nums) => {
      if (!err) {
        self.emitUpdate(id);
      }
    });
  }

  self.appendRecord = function (info) {
    if (info.req.headers.anyproxy_web_req) { //request from web interface
      return -1;
    }

    const thisId = globalId++;
    const finalInfo = normalizeInfo(thisId, info);
    db.insert(finalInfo);
    self.updateRecordBody(thisId, info);

    self.emitUpdate(thisId, finalInfo);
    return thisId;
  };

  //update recordBody if exits

  //TODO : trigger update callback
  const BODY_FILE_PRFIX = 'res_body_';
  self.updateRecordBody = function (id, info) {
    if (id === -1) return;

    if (!id || !info.resBody) return;
    //add to body map
    //ignore image data
    const bodyFile = path.join(cachePath, BODY_FILE_PRFIX + id);
    fs.writeFile(bodyFile, info.resBody);
  };

  self.getBody = function (id, cb) {
    if (id < 0) {
      cb && cb('');
    }

    const bodyFile = path.join(cachePath, BODY_FILE_PRFIX + id);
    fs.access(bodyFile, fs.F_OK | fs.R_OK, (err) => {
      if (err) {
        cb && cb(err);
      } else {
        fs.readFile(bodyFile, cb);
      }
    });
  };

  self.getDecodedBody = function (id, cb) {
    const result = {
      type: 'unknown',
      mime: '',
      content: ''
    };
    global.recorder.getSingleRecord(id, (err, doc) => {
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
              result.content = bodyContent.toString();
            }
          } catch (e) {}
          cb(null, result);
        }
      });
    });
  };

  self.getSingleRecord = function (id, cb) {
    db.find({ _id: parseInt(id, 10) }, cb);
  };

  self.getSummaryList = function (cb) {
    db.find({}, cb);
  };

  self.getRecords = function (idStart, limit, cb) {
    limit = limit || 10;
    idStart = typeof idStart === 'number' ? idStart : (globalId - limit);
    db.find({ _id: { $gte: parseInt(idStart, 10) } })
      .sort({ _id: 1 })
      .limit(limit)
      .exec(cb);
  };

  self.clear = function () {
    proxyUtil.deleteFolderContentsRecursive(cachePath, true);
  }

  self.db = db;
}

util.inherits(Recorder, events.EventEmitter);

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

module.exports = Recorder;
