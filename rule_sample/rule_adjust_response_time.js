//rule scheme :

module.exports = {
    summary: function () {
        return 'pause the response';
    },

    pauseBeforeSendingResponse : function(req,res){
        //delay all the response for 1500ms
        return 1500;
    }

};