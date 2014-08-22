var rules = {
    "map" :[
        {
            "host"      :/./,            //regExp
            "path"      :/\/path\/test/, //regExp
            "localFile" :"",             //this file will be returned to user when host and path pattern both meets the request
            "localDir"  :"~/"            //find the file of same name in localdir. anyproxy will not read localDir settings unless localFile is falsy
        }
        // ,{
        //     "host"      :/./,
        //     "path"      :/\.(png|gif|jpg|jpeg)/,
        //     "localFile" :"/Users/Stella/tmp/test.png",
        //     "localDir"  :"~/"
        // }
        ,{
            "host"      :/./,
            "path"      :/tps/,
            "localFile" :"",
            "localDir"  :"/Users/Stella/tmp/"
        },{
            "host"      :/./,
            "path"      :/\.(js)/,
            "sleep"     :5//seconds
        }
    ]
    ,"httpsConfig":{
        "bypassAll" : false,  //by setting this to true, anyproxy will not intercept any https request
        "interceptDomains":[/www\.a\.com/,/www\.b\.com/] //by setting bypassAll:false, requests towards these domains will be intercepted, and try to meet the map rules above
    }
}

module.exports = rules;