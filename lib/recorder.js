//start recording and share a list when required
var zlib      = require('zlib'),
    Datastore = require('nedb'), 
    util      = require("util"),
    events    = require('events'),
    db        = new Datastore(); //in-memory store

function Recorder(){
    var self = this,
        id   = 1;

    self.recordBodyMap = []; // id - body 

    self.updateRecord = function(id,info){
        if(id < 0 ) return;

        var finalInfo = normalizeInfo(id,info);

        db.update({_id:id},finalInfo);
        self.updateRecordBody(id,info);

        self.emit("update",finalInfo);
    };

 
    self.appendRecord = function(info){
        if(info.req.headers.anyproxy_web_req){ //request from web interface
            return -1;
        }

        var thisId    = id++,
            finalInfo = normalizeInfo(thisId,info);
        db.insert(finalInfo);
        self.updateRecordBody(id,info);

        self.emit("update",finalInfo);
        return thisId;
    };
    

    //update recordBody if exits
    self.updateRecordBody =function(id,info){
        if(id == -1) return;

        if(!id || !info.resBody) return;
        //add to body map
        //do not save image data
        if(/image/.test(info.resHeader['content-type'])){
            self.recordBodyMap[id] = "(image)";
        }else{
            self.recordBodyMap[id] = info.resBody.toString();
        }
    };


    self.getBody = function(id){
        if(id < 0){
            return "";
        }

        return self.recordBodyMap[id] || "";
    };

    self.getSummaryList = function(cb){
        db.find({},cb);
    };
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