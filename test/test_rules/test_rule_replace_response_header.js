//rule scheme : remove the cache headers in response headers
const Q = require('q');

module.exports = {
    summary: function () {
        return 'The rule to remove the cache headers in response';
    },

    replaceResponseHeader: function(req,res,header){
        const d = Q.defer();

        header = Object.assign({}, header);
        if (req.url.indexOf('test/normal_request1') > -1) {
            header.replacedheaderkey = 'replacedHeader_value_in_rule';
        }

        d.resolve(header);

        return d.promise;
    }
};