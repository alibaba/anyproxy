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

module.exports.getUserHome = function(){
    return process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
}

module.exports.simpleRender = function(str, object, regexp){
    return String(str).replace(regexp || (/\{\{([^{}]+)\}\}/g), function(match, name){
        if (match.charAt(0) == '\\') return match.slice(1);
        return (object[name] != null) ? object[name] : '';
    });

}
