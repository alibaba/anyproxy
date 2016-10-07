//rule scheme : remove the cache header in request and response

module.exports = {
    summary: function () {
        return 'The rule to disable cache';
    },

    replaceRequestOption : function(req,option){
        return new Promise((resolve, reject) => {
            option = Object.assign({}, option);
            delete option.headers['if-none-match'];
            delete option.headers['if-modified-since'];
            resolve(option);
        });
    },

    replaceResponseHeader: function(req,res,header){
        return new Promise((resolve, reject) => {
            header = Object.assign({}, header);
            header = header || {};
            header["Cache-Control"] = "no-cache, no-store, must-revalidate";
            header["Pragma"] = "no-cache";
            header["Expires"] = 0;

            resolve(header);
        });
    }
};