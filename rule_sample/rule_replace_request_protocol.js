//replace all the images with local one
const fs      = require("fs");
const Q = require('q');

const LOCAL_IMAGE = "/Users/path/to/image.png";


module.exports = {

    summary:function(){
        return "replace the request protocol.";
    },

    //redirect all https request to http
    replaceRequestProtocol: function(req,reqBody){
        const d = Q.defer();
        d.resolve('http');
        return d.promise;
    }
};

