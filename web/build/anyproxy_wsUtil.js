/*
web socket util for AnyProxy
https://github.com/alibaba/anyproxy
*/

/*
{
	baseUrl : ""
}
config
config.baseUrl
config.port
config.onOpen
config.onClose
config.onError
config.onGetData
config.onGetUpdate
config.onGetBody
config.onError
*/
function anyproxy_wsUtil(config){
	config = config || {};
	if(!WebSocket){
		throw (new Error("webSocket is not available on this browser"));
	}

	var self = this;
	var baseUrl    = config.baseUrl || "127.0.0.1",
		socketPort = config.port || 8003;

	var dataSocket = new WebSocket("ws://" + baseUrl + ":" + socketPort);

	self.bodyCbMap = {};
	dataSocket.onmessage = function(event){
		config.onGetData && config.onGetData.call(self,event.data);

		try{
			var data    = JSON.parse(event.data),
				type    = data.type,
				content = data.content,
				reqRef  = data.reqRef;
		}catch(e){
			config.onError && config.onError.call(self, new Error("failed to parse socket data - " + e.toString()) );
		}

		if(type == "update"){
			config.onGetUpdate && config.onGetUpdate.call(self, content);

		}else if(type == "body"){
			config.onGetBody && config.onGetBody.call(self, content, reqRef);

			if(data.reqRef && self.bodyCbMap[reqRef]){
				self.bodyCbMap[reqRef].call(self,content);
			}
		}
	}

	dataSocket.onopen = function(e){
		config.onOpen && config.onOpen.call(self,e);
	}
	dataSocket.onclose = function(e){
		config.onClose && config.onClose.call(self,e);
	}
	dataSocket.onerror = function(e){
		config.onError && config.onError.call(self,e);
	}

	self.dataSocket = dataSocket;
};

anyproxy_wsUtil.prototype.send = function(data){
	if(typeof data == "object"){
		data = JSON.stringify(data);
	}
	this.dataSocket.send(data);
};

anyproxy_wsUtil.prototype.reqBody = function(id,callback){
	if(!id) return;

	var payload = {
		type   : "reqBody",
		id     : id
	};
	if(callback){
		var reqRef = "r_" + Math.random()*100 + "_" + (new Date().getTime());
		payload.reqRef = reqRef;
		this.bodyCbMap[reqRef] = callback;
	}
	this.send(payload);
};

module.exports = anyproxy_wsUtil;