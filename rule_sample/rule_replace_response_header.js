//rule scheme : remove the cache headers in response headers
const Q = require('q');

module.exports = {
    summary: function () {
        return 'The rule to remove the cache headers in response';
    },

    replaceResponseHeader: function(req,res,header){
        const d = Q.defer();

        header = Object.assign({}, header);
        header = header || {};
        header["Cache-Control"] = "no-cache, no-store, must-revalidate";
        header["Pragma"] = "no-cache";
        header["Expires"] = 0;

        d.resolve(header);

        return d.promise;
    }
};