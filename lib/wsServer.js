//websocket server manager

var  WebSocketServer = require('ws').Server,
     logUtil         = require("./log");

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
        result.type ="body";
        GLOBAL.recorder.getBodyUTF8(jsonData.id, function(err, data){
            if(err){
                result.content = {
                    id    : null,
                    body  : null,
                    error : err.toString()
                };    
            }else{
                result.content = {
                    id   : jsonData.id,
                    body : data
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
	var wss = new WebSocketServer({port: config.port});
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
	});

    wss.on("close",function(){});

	GLOBAL.recorder.on("update",function(data){
        try{
    	    wss && wss.broadcast({
    	        type   : "update",
    	        content: data
    	    });

        }catch(e){
            console.log("ws error");
            console.log(e);
        }
	});

    //Iconv-lite warning: decode()-ing strings is deprecated. Refer to https://github.com/ashtuchkin/iconv-lite/wiki/Use-Buffers-when-decoding
    
	return wss;
}

module.exports = wsServer;