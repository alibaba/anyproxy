//replace all the images with local one
const fs      = require("fs");

const LOCAL_IMAGE = "/Users/path/to/image.png";


module.exports = {

    summary:function(){
        return "replace all the images with local one";
    },

    //mark if use local response
    shouldUseLocalResponse : function(req,reqBody){
        return new Promise((resolve, reject) => {
            if(/\.(png|gif|jpg|jpeg)$/.test(req.url)){
                req.replaceLocalFile = true;
                resolve(true);
            }else{
                resolve(false);
            }
        });
    },

    dealLocalResponse : function(req,reqBody){
        if(req.replaceLocalFile){
            return new Promise((resolve, reject) => {
                resolve({
                    code: 200,
                    header: { "content-type":"image/png" },
                    body: fs.readFileSync(LOCAL_IMAGE)
                });
            });
        }
    }
};

