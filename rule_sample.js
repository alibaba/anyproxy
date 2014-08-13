var rules = {
    "map" :[
        {
            "host"      :/./,
            "path"      :/\/path\/test/,
            "localFile" :"",
            "localDir"  :"~/"
        }
        ,{
            "host"      :/./,
            "path"      :/png/,
            "localFile" :"/Users/Stella/tmp/test.png",
            "localDir"  :"~/"
        }
        ,{
            "host"      :/./,
            "path"      :/jpg/,
            "localFile" :"/Users/Stella/tmp/test.png",
            "localDir"  :"~/"
        }
        ,{
            "host"      :/./,
            "path"      :/gif/,
            "localFile" :"/Users/Stella/tmp/test.png",
            "localDir"  :"~/"
        }
    ]
    ,"httpsConfig":{
        // "bypassAll" : true,
        // "interceptDomains":[/^.*alibaba-inc\.com$/]
        "bypassAll" : false,
        "interceptDomains":[]
    }
}

module.exports = rules;