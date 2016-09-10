//rule scheme :
const Q = require('q');

module.exports = {

    replaceRequestOption : function(req,option){
        const d = Q.defer();

        const newOption = Object.assign({}, option);
        if(newOption.hostname == "localhost" && newOption.path == "/test/should_replace_option"){
            newOption.path = '/test/new_replace_option';
        }
        d.resolve(newOption);
        return d.promise;
    }
};