var fs   = require("fs"),
    path = require("path");

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
    return process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
}
module.exports.getUserHome = getUserHome;


module.exports.getAnyProxyHome = function(){
    var home = path.join(util.getUserHome(),"/.anyproxy/");

    if(!fs.existsSync(home)){
        try{
            fs.mkdirSync(home,0777);
        }catch(e){
            return null;
        }
    }

    return home;
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
}
