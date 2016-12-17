//websocket server manager

const WebSocketServer = require('ws').Server;
const logUtil         = require("./log");

function resToMsg(msg,cb){
    var result = {},
        jsonData;

    try{
        jsonData = JSON.parse(msg);
    }catch(e){
        result = {
            type : "error",
            error: "failed to parse your request : " + e.toString()
        };
        cb && cb(result);
        return;
    }

    if(jsonData.reqRef){
        result.reqRef = jsonData.reqRef;
    }

    if(jsonData.type == "reqBody" && jsonData.id){
        result.type = "body";
        global.recorder.getBody(jsonData.id, function(err, data){
            if(err){
                result.content = {
                    id    : null,
                    body  : null,
                    error : err.toString()
                };
            }else{
                result.content = {
                    id   : jsonData.id,
                    body : data.toString()
                };
            }
            cb && cb(result);
        });
    }else{ // more req handler here
        return null;
    }
}

//config.port
function wsServer(config){
    //web socket interface
    const self = this;
    const wss  = new WebSocketServer({ port: config.port });

    // the queue of the messages to be delivered
    let messageQueue = [];
    // the flat to indicate wheter to broadcast the record
    let broadcastFlag = true;

    setInterval(() => {
        broadcastFlag = true;
        sendMultipleMessage();
    }, 50);

    function sendMultipleMessage (data) {
        // if the flag goes to be true, and there are records to send
        if (broadcastFlag && messageQueue.length > 0) {
            wss && wss.broadcast({
                type   : "updateMultiple",
                content: messageQueue
            });
            messageQueue = [];
            broadcastFlag = false;
        } else {
            data && messageQueue.push(data);
        }
    }

    wss.broadcast = function(data) {
        var key = data.id;
        if(typeof data == "object"){
            data = JSON.stringify(data);
        }

        for(var i in this.clients){
            try{
                this.clients[i].send(data);
            }catch(e){
                logUtil.printLog("websocket failed to send data, " + e, logUtil.T_ERR);
            }
        }
    };

    wss.on("connection",function(ws){
        ws.on("message",function(msg){
            resToMsg(msg,function(res){
                res && ws.send(JSON.stringify(res));
            });
        });

        ws.on('error', function (e) {
            console.error('error in ws:', e);
        });
    });

    wss.on('error', function (e) {
        logUtil.printLog("websocket error, " + e, logUtil.T_ERR);
    });

    wss.on("close",function(){});

    global.recorder.on("update",function(data){
        try{
            sendMultipleMessage(data);

            // wss && wss.broadcast({
            //     type: 'update',
            //     content: data
            // });

        }catch(e){
            console.log("ws error");
            console.log(e);
        }
    });

    self.wss = wss;
}

wsServer.prototype.closeAll = function(){
    var self = this;
    self.wss.close();
};

module.exports = wsServer;
