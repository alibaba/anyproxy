//rule scheme :
const Q = require('q');

module.exports = {
    summary: function () {
        return "The rule to replace request protocol";
    },
    replaceRequestProtocol : function(req,protocol){
        const d = Q.defer();
        d.resolve('http');
        return d.promise;
    },

    // got to replace the protocol, since the https is 3001, and http is 3000
    replaceRequestOption: function (req, options) {
        const d = Q.defer();
        options = Object.assign({}, options);
        options.port = 3000;
        d.resolve(options);
        return d.promise;
    }

};