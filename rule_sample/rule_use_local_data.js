//replace all the images with local one
const fs      = require("fs");
const Q = require('q');

const LOCAL_IMAGE = "/Users/path/to/image.png";


module.exports = {

    summary:function(){
        return "replace all the images with local one";
    },

    //mark if use local response
    shouldUseLocalResponse : function(req,reqBody){
        const d = Q.defer();

        if(/\.(png|gif|jpg|jpeg)$/.test(req.url)){
            req.replaceLocalFile = true;
            d.resolve(true);
        }else{
            d.resolve(false);
        }

        return d.promise;
    },

    dealLocalResponse : function(req,reqBody){
        if(req.replaceLocalFile){
            const d = Q.defer();
            d.resolve({
                code: 200,
                header: { "content-type":"image/png" },
                body: fs.readFileSync(LOCAL_IMAGE)
            });

            d.promise;
        }
    }
};

