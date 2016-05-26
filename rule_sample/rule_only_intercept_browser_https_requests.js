//rule scheme :

module.exports = {


    shouldInterceptHttpsReq :function(req){
        //intercept request send by browser
        //otherwise, all the https traffic will not go through this proxy

        // return true;
        if (req.headers && req.headers['user-agent'] && /^Mozilla/.test(req.headers['user-agent'])) {
            return true;
        } else {
            return false;
        }
    }
};
