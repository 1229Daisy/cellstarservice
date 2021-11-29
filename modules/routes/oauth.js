/**
 * Created by Administrator on 2020/10/16.
 */

const express = require('express');
const router = express.Router();
const request = require('request');
const {appID,appsecret}= require("../config");
const rp = require("request-promise-native");
//
//module.exports = () =>{
//    function wxlogin(){
//
//        return new Promise((resolve, reject) => {
//            const return_uri = 'https://www.baidu.com/';
//            const url = `https://open.weixin.qq.com/connect/oauth2/authorize?appid='+${appID}+'&redirect_uri='+https://www.baidu.com+'&response_type=code&scope='+scope+'&state=STATE#wechat_redirect`
//            rp({method: 'POST', url, json: true}).then(res => {
//                console.log(res);
//                resolve(res)
//            }).catch(err => {
//                console.log(err);
//                reject('xx' + err)
//            })
//        })
//    }
//
//    function getToken(code) {
//        let reqUrl = 'https://api.weixin.qq.com/sns/oauth2/access_token?';
//        const AppID = 'wxfc9dec422e602a83';
//        const AppSecret = 'a6f5a2764273d25d282282db5498c633';
//        let params = {
//            appid: AppID,
//            secret: AppSecret,
//            code: code,
//            grant_type: 'authorization_code'
//        };
//
//        let options = {
//            method: 'get',
//            url: reqUrl+qs.stringify(params)
//        };
//        console.log(options.url);
//        return new Promise((resolve, reject) => {
//            request(options, function (err, res, body) {
//                if (res) {
//                    resolve(body);
//                } else {
//                    reject(err);
//                }
//            })
//        })
//    }
//};
///* 微信登陆 */
const AppID = 'wxfc9dec422e602a83';
const AppSecret = 'a6f5a2764273d25d282282db5498c633';
router.get('/wx_login', function(req,res, next){
    //console.log("oauth - login")

    // 第一步：用户同意授权，获取code
    const router = 'get_wx_access_token';
    // 这是编码后的地址
    const return_uri = 'https://www.baidu.com/'+router;
    const scope = 'snsapi_userinfo';
    res.redirect('https://open.weixin.qq.com/connect/oauth2/authorize?appid='+AppID+'&redirect_uri='+return_uri+'&response_type=code&scope='+scope+'&state=STATE#wechat_redirect');

});


router.get('/get_wx_access_token', function(req,res, next){
    //console.log("get_wx_access_token")
    //console.log("code_return: "+req.query.code)
    // 第二步：通过code换取网页授权access_token
    const code = req.query.code;
    request.get(
        {
            url:'https://api.weixin.qq.com/sns/oauth2/access_token?appid='+AppID+'&secret='+AppSecret+'&code='+code+'&grant_type=authorization_code'
        },
        function(error, response, body){
            if(response.statusCode == 200){

                // 第三步：拉取用户信息(需scope为 snsapi_userinfo)
                //console.log(JSON.parse(body));
                var data = JSON.parse(body);
                var access_token = data.access_token;
                var openid = data.openid;

                request.get(
                    {
                        url:'https://api.weixin.qq.com/sns/userinfo?access_token='+access_token+'&openid='+openid+'&lang=zh_CN',
                    },
                    function(error, response, body){
                        if(response.statusCode == 200){

                            // 第四步：根据获取的用户信息进行对应操作
                            var userinfo = JSON.parse(body);
                            console.log(JSON.parse(body));
                            console.log('获取微信信息成功！');

                            // 小测试，实际应用中，可以由此创建一个帐户
                            //res.send("\
                            //    <h1>"+userinfo.nickname+" 的个人信息</h1>\
                            //    <p><img src='"+userinfo.headimgurl+"' /></p>\
                            //    <p>"+userinfo.city+"，"+userinfo.province+"，"+userinfo.country+"</p>\
                            //");

                        }else{
                            console.log(response.statusCode);
                        }
                    }
                );
            }else{
                console.log(response.statusCode);
            }
        }
    );
});
module.exports = router;
