//rule scheme :

module.exports = {
	replaceRequestOption : function(req,option){
	    var newOption = option;
	    delete newOption.headers['proxy-authorization'];
	    delete newOption.headers['proxy-connection'];

	    return newOption;
	}
};
