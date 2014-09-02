//replace all the images with local one

var url = require("url"),
    path    = require("path"),
    fs      = require("fs"),
    buffer  = require("buffer");

var map = [
        {
            "host"      :/./,
            "path"      :/\.(png|gif|jpg|jpeg)/,
            "localFile" :"/Users/Stella/tmp/test.png",
            "localDir"  :"~/"
        }
    ];

module.exports = {
    shouldUseLocalResponse : function(req,reqBody){
        var host       = req.headers.host,
            urlPattern = url.parse(req.url),
            path       = urlPattern.path;

        for(var index in map){
            var rule = map[index];

            var hostTest = new RegExp(rule.host).test(host),
                pathTest = new RegExp(rule.path).test(path);

            if(hostTest && pathTest && (rule.localFile || rule.localDir) ){
                var targetLocalfile = rule.localFile;

                //localfile not set, map to dir
                if(!targetLocalfile){ //find file in dir, /a/b/file.html -> dir + b/file.html
                    var remotePathWithoutPrefix = path.replace(new RegExp(rule.path),""); //remove prefix
                    targetLocalfile = pathUtil.join(rule.localDir,remotePathWithoutPrefix);
                }

                if(fs.existsSync(targetLocalfile)){
                    console.log("==>local file: " + targetLocalfile);
                    req.replaceLocalFile = targetLocalfile; //add a flag to req object
                    return true;
                }
            }
        }
        return false;
    },

    dealLocalResponse : function(req,reqBody,callback){
        if(req.replaceLocalFile){
            callback(200, {"content-type":"image/png"}, fs.readFileSync(req.replaceLocalFile) );
        }
    }
};

