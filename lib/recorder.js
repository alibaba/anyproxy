//start recording and share a list when required
var zlib      = require('zlib'),
    Datastore = require('nedb'), 
    util      = require("util"),
    fs        = require("fs"),
    events    = require('events'),
    iconv     = require('iconv-lite'),
    logUtil   = require("./log");

//option.filename
function Recorder(option){
    var self = this,
        id   = 1,
        db;

    option = option || {};
    if(option.filename && typeof option.filename == "string"){
        try{
            if(fs.existsSync(option.filename)){
                fs.writeFileSync(option.filename,""); //empty original file
            }

            db = new Datastore({
                filename : option.filename,
                autoload :true
            });
            db.persistence.setAutocompactionInterval(5001);
            logUtil.printLog("db file : " + option.filename);

        }catch(e){
            logUtil.printLog(e, logUtil.T_ERR);            
            logUtil.printLog("Failed to load on-disk db file. Will use in-meomory db instead.", logUtil.T_ERR);
            db = new Datastore();
        }
        
    }else{
        //in-memory db
        db = new Datastore();
    }

    self.recordBodyMap = []; // id - body 

    self.emitUpdate = function(id,info){
        if(info){
            self.emit("update",info);
        }else{
            self.getSingleRecord(id,function(err,doc){
                if(!err && !!doc && !!doc[0]){
                    self.emit("update",doc[0]);
                }
            });
        }
    };

    self.updateRecord = function(id,info){
        if(id < 0 ) return;

        var finalInfo = normalizeInfo(id,info);

        db.update({_id:id},finalInfo);
        self.updateRecordBody(id,info);

        self.emitUpdate(id,finalInfo);
    };

    self.updateExtInfo = function(id,extInfo){
        db.update({_id:id},{ $set: { ext: extInfo } },{},function(err,nums){
            if(!err){
                self.emitUpdate(id);
            }
        });

    }

    self.appendRecord = function(info){
        if(info.req.headers.anyproxy_web_req){ //request from web interface
            return -1;
        }

        var thisId    = id++,
            finalInfo = normalizeInfo(thisId,info);
        db.insert(finalInfo);
        self.updateRecordBody(id,info);

        self.emitUpdate(id,finalInfo);
        return thisId;
    };

    //update recordBody if exits
    self.updateRecordBody =function(id,info){
        if(id == -1) return;

        if(!id || !info.resBody) return;
        //add to body map
        //ignore image data
        if(/image/.test(info.resHeader['content-type'])){
            self.recordBodyMap[id] = "(image)";
        }else{
            self.recordBodyMap[id] = info.resBody;
        }
    };

    self.getBody = function(id){
        if(id < 0){
            return "";
        }

        return self.recordBodyMap[id] || "";
    };

    self.getBodyUTF8 = function(id,cb){
        var bodyContent = self.getBody(id),
            result      = "";

        GLOBAL.recorder.getSingleRecord(id,function(err,doc){
            //check whether this record exists
            if(!doc || !doc[0]){
                cb(new Error("failed to find record for this id"));
                return;
            }

            if(!bodyContent){
                cb(null,result);
            }else{
                var record      = doc[0],
                    resHeader   = record['resHeader'] || {};
                try{
                    var charsetMatch = JSON.stringify(resHeader).match(/charset="?([a-zA-Z0-9\-]+)"?/);
                    if(charsetMatch && charsetMatch.length > 1){
                        var currentCharset = charsetMatch[1].toLowerCase();
                        if(currentCharset != "utf-8" && iconv.encodingExists(currentCharset)){
                            bodyContent = iconv.decode(bodyContent, currentCharset);
                        }
                    }
                }catch(e){}

                cb(null,bodyContent.toString());
            }

        });
    };

    self.getSingleRecord = function(id,cb){
        db.find({_id:parseInt(id)},cb);
    };

    self.getSummaryList = function(cb){
        db.find({},cb);
    };

    self.getRecords = function(idStart, limit, cb){
        limit   = limit || 10;
        idStart = typeof idStart == "number" ? idStart : (id - limit);
        db.find({ _id: { $gte: parseInt(idStart) } }).limit(limit).exec(cb);
    };

    self.clear = function (cb) {
        db.remove({}, { multi: true }, cb);
    };

    self.db = db;
}

util.inherits(Recorder, events.EventEmitter);

function normalizeInfo(id,info){
    var singleRecord = {};

    //general
    singleRecord._id       = id;
    singleRecord.id        = id;
    singleRecord.url       = info.url;
    singleRecord.host      = info.host;
    singleRecord.path      = info.path;
    singleRecord.method    = info.method;

    //req
    singleRecord.reqHeader = info.req.headers;
    singleRecord.startTime = info.startTime;
    singleRecord.reqBody   = info.reqBody || "";
    singleRecord.protocol  = info.protocol || "";

    //res
    if(info.endTime){
        singleRecord.statusCode= info.statusCode;
        singleRecord.endTime   = info.endTime;
        singleRecord.resHeader = info.resHeader;
        singleRecord.length    = info.length;
        if(info.resHeader['content-type']){
            singleRecord.mime      = info.resHeader['content-type'].split(";")[0];
        }else{
            singleRecord.mime      = "";
        }

        singleRecord.duration  = info.endTime - info.startTime;
    }else{
        singleRecord.statusCode= "";
        singleRecord.endTime   = "";
        singleRecord.resHeader = "";
        singleRecord.length    = "";
        singleRecord.mime      = "";
        singleRecord.duration  = "";
    }

    return singleRecord;
}

module.exports = Recorder;