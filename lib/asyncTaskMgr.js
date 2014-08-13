function asyncTaskMgr(){
    var self = this;

    self.callbackList = {
        sampleName:{
            status:0, /* 0,stopped,will not callback  /  1,loading / 2,loaded */
            result:null,
            callbackList:[]
        }
    }

    self.addTask = function(name,cb,action){
        if(self.callbackList[name]){
            var task = self.callbackList[name];

            if(task.status == 2){ //done
                cb && cb.apply(null,task.result);

            }else if(task.status == 1){ //pending
                task.callbackList.push(cb);
            
            }else if(task.status == 0){ //stopped
                return; //do nothing
            }
        }else{
            var task;
            task = self.callbackList[name] = {
                status : 1,
                result : null,
                callbackList : [cb]
            };

            action && action.call(null,function(){  //action应该带一个回调
                if(arguments && arguments[0] === -1){  //返回第一个参数为-1，为停止任务
                    task.status = 0;
                    task.callbackList = [];
                }else{
                    task.result = arguments;
                    task.status = 2;
                    var tmpCb;
                    while(tmpCb = task.callbackList.shift()){
                        tmpCb && tmpCb.apply(null,task.result);
                    }
                }
            });
        }
    }

    
};

module.exports = asyncTaskMgr;
