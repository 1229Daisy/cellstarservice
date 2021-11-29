const openid = require("./auth").openid;
module.exports={

 "button":[
            {
                "type":"click",
                "name":"科研服务",
                "key":"other",
                "sub_button":[
                    {
                        "type":"view",
                        "name":"肝癌预约",
                        "url":"http://192.168.0.109:3000/admin/xx/"
                    },
                    {
                        "type":"view",
                        "name":"宫颈癌预约",
                        "url":"http://192.168.0.109:3000/maintaining"
                    },
                    {
                        "type":"view",
                        "name":"甲基化年龄预约",
                        "url":"http://192.168.0.109:3000/maintaining"
                    }
                ]

            },
            {
                "name":"其他",
                "sub_button":[
                    {
                        "type":"view",
                            "name":"肝癌报告查询",
                        "url":"http://192.168.0.109:3000/checkLiverReport"
                    },
                    {
                        "type":"view",
                        "name":"宫颈癌报告查询",
                        "url":"http://192.168.0.109:3000/maintaining"
                    },
                    {
                        "type":"view",
                        "name":"甲基化报告查询",
                        "url":"http://192.168.0.109:3000/maintaining"
                    },
                    {
                        "type":"view",
                        "name":"联系我们",
                        "url":"http://192.168.0.109:3000/maintaining"
                    }
                ]
            }
           ]




}
