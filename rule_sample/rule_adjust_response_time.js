//rule scheme :

module.exports = {

    pauseBeforeSendingResponse : function(req,res){
        //delay all the response for 1500ms
        return 1500;
    }

};