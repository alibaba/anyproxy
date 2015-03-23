//start recording and share a list when required
var zlib      = require('zlib'),
    Datastore = require('nedb'), 
    util      = require("util"),
    fs        = require("fs"),
    events    = require('events'),
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

    self.getSingleRecord = function(id,cb){
        db.find({_id:parseInt(id)},cb);
    }

    self.getSummaryList = function(cb){
        db.find({},cb);
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