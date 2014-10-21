//replace all the images with local one
var fs      = require("fs");

var LOCAL_IMAGE = "/Users/path/to/image.png";

module.exports = {

    summary:function(){
        return "replace all the images with local one";
    },

    //mark if use local response
    shouldUseLocalResponse : function(req,reqBody){
        if(/\.(png|gif|jpg|jpeg)$/.test(req.url)){
            req.replaceLocalFile = true;
            return true;
        }else{
            return false;
        }
    },

    dealLocalResponse : function(req,reqBody,callback){
        if(req.replaceLocalFile){
            callback(200, {"content-type":"image/png"}, fs.readFileSync(LOCAL_IMAGE) );
        }
    }
};

