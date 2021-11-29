/**
 * Created by Administrator on 2020/9/9.
 */
/*
*
* 服务器验证 有效性的模块
* */


const  sha1 = require("sha1");
const config = require('../config');
//引入tool
const {getUserDataAsync} = require('../utils/tool');


module.exports = () =>{


    return async (req,res,next) => {
        //微信服务器参数
        console.log(req.query);

        /*
         *
         * { signature: 'e3da83cd14417ec2b619125667977948e6944a9f',
         echostr: '8732109152779763133',
         timestamp: '1599700264',
         nonce: '822297294' }
         * */
        const {signature,echostr,timestamp,nonce}=req.query;
        const {token}=config;

        //1、字典排序2、sha1 加密
        //const  arr =[timestamp,nonce,token];
        const  sha1Str = sha1([timestamp,nonce,token].sort().join(''));
        //3、加密完成生产一个signatrue 和微信发送过来的进行对比
        if(req.method ==='GET'){
            if(sha1Str===signature){
                res.send(echostr)
            }else{
                res.end('error');
            }
        }else if(req.method ==='POST'){
            //微信服务器向用户发送的数据用post 转开发者服务器
            //验证消息来自于微信服务器

            if(sha1Str !==signature){
                res.end('error');
            }
            console.log(req.query);
            const xmlData = await getUserDataAsync(req);
            res.end('');
        }else{
            res.end('error');
        }
        
        
    }
};
