//rule scheme :

module.exports = {
    replaceResponseHeader: function(req,res,header){
        header = header || {};
        header["Cache-Control"]                    = "no-cache, no-store, must-revalidate";
        header["Pragma"]                           = "no-cache";
        header["Expires"]                          = 0;

        return header;
    }
};

function disableCacheHeader(header){

}