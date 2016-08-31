var fs   = require("fs"),
    path = require("path"),
    mime = require('mime-types'),
    color = require('colorful'),
    logUtil = require("./log"),
    exec = require('child_process').exec;

const changeCase = require('change-case');
// {"Content-Encoding":"gzip"} --> {"content-encoding":"gzip"}
module.exports.lower_keys = function(obj){
    for(var key in obj){
        var val = obj[key];
        delete obj[key];

        obj[key.toLowerCase()] = val;
    }

    return obj;
}

module.exports.merge = function(baseObj, extendObj){
	for(var key in extendObj){
		baseObj[key] = extendObj[key];
	}

	return baseObj;
}

function getUserHome(){
    return process.env.HOME || process.env.USERPROFILE;
}
module.exports.getUserHome = getUserHome;


module.exports.getAnyProxyHome = function(){
    var home = path.join(util.getUserHome(),"/.anyproxy/");

    if(!fs.existsSync(home)){
        try{
            fs.mkdirSync(home, '0777');
        }catch(e){
            return null;
        }
    }

    return home;
}

var CACHE_DIR_PREFIX = "cache_r";
module.exports.generateCacheDir = function(){
    var rand      = Math.floor(Math.random() * 1000000),
        cachePath = path.join(util.getAnyProxyHome(),"./" + CACHE_DIR_PREFIX + rand);

    fs.mkdirSync(cachePath, '0777');
    return cachePath;
}

module.exports.clearCacheDir = function(cb){
    var home  = util.getAnyProxyHome(),
        isWin = /^win/.test(process.platform);

    var dirNameWildCard = CACHE_DIR_PREFIX + "*";
    if(isWin){
        exec("for /D %f in (" + dirNameWildCard + ") do rmdir %f /s /q",{cwd : home},cb);
    }else{
        exec("rm -rf " + dirNameWildCard + "",{cwd : home},cb);
    }
}

module.exports.simpleRender = function(str, object, regexp){
    return String(str).replace(regexp || (/\{\{([^{}]+)\}\}/g), function(match, name){
        if (match.charAt(0) == '\\') return match.slice(1);
        return (object[name] != null) ? object[name] : '';
    });
}

module.exports.filewalker = function(root,cb){
    root = root || process.cwd();

    var ret = {
        directory :[],
        file      :[]
    };

    fs.readdir(root,function(err, list){
        if(list && list.length){
            list.map(function(item){
                var fullPath = path.join(root,item),
                    stat     = fs.lstatSync(fullPath);

                if(stat.isFile()){
                    ret.file.push({
                        name     : item,
                        fullPath : fullPath
                    });

                }else if(stat.isDirectory()){
                    ret.directory.push({
                        name     : item,
                        fullPath : fullPath
                    });
                }
            });
        }

        cb && cb.apply(null,[null,ret]);
    });
};

/*
* 获取文件所对应的content-type以及content-length等信息
* 比如在useLocalResponse的时候会使用到
*/
module.exports.contentType = function (filepath) {
    return mime.contentType(path.extname(filepath));
};

/*
* 读取file的大小，以byte为单位
*/
module.exports.contentLength = function (filepath) {
    try {
        var stat = fs.statSync(filepath);
        return stat.size;
    } catch (e) {
        logUtil.printLog(color.red("\nfailed to ready local file : " + filepath));
        logUtil.printLog(color.red(e));
        return 0;
    }
};

module.exports.showRootInstallTip = function () {
    logUtil.printLog(color.red("can not find rootCA.crt or rootCA.key"), logUtil.T_ERR);
    logUtil.printLog(color.red("you may generate one by the following methods"), logUtil.T_ERR);
    logUtil.printLog(color.red("\twhen using globally : anyproxy --root"), logUtil.T_ERR);
    logUtil.printLog(color.red("\twhen using as a module : require(\"anyproxy\").generateRootCA();"), logUtil.T_ERR);
    logUtil.printLog(color.red("\tmore info : https://github.com/alibaba/anyproxy/wiki/How-to-config-https-proxy"), logUtil.T_ERR);
};

/*
* remove the cache before requering, the path SHOULD BE RELATIVE TO UTIL.JS
*/
module.exports.freshRequire = function (path) {
    delete require.cache[require.resolve(path)];
    return require(path);
};

module.exports.upper_keys = function (obj) {
    var upperObject = {};
    for(var key in obj) {
        var upperKey = changeCase.headerCase(key);
        upperObject[upperKey] = obj[key];
    }

    return upperObject;
};

