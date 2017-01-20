//replace all the images with local one
const fs      = require("fs");

module.exports = {

    summary:function(){
        return "replace the request protocol.";
    },

    //redirect all https request to http
    replaceRequestProtocol: function(req,reqBody){
        return new Promise((resolve, reject) => {
            resolve('http');
        });
    }
};

