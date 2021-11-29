/**
 * Created by Administrator on 2020/9/9.
 */


/*
*
* ???acesstoken ????????
*
* GET https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=APPID&secret=APPSECRET
*
*
*步骤定义
* 如果txt文档有accesstoken 就读取 readAcessToken??
*   -是否过期
*      -进行检验isValidAcessToken??
*       -????
*       -??????????acess_token(getAcessToken),??????????????????????????��?????saveAcessToken??
*       ?????
*       ??????
*     -??????????
*     ??????????acesstoken??getAcesstoken?????????????saveAcessToken????????
* */
const rp = require("request-promise-native");
const iconv = require('iconv-lite');
const {writeFile,readFile} = require("fs");
const {appID,appsecret}= require("../config");

//引入menu模块
const menu=require("./menu");



//
//module.exports = () => {
class wechat{

    constructor() {

    }

    /*
     *Get 一个accesstoken
     *
     * */
     getAccessToken() {
        //通过appid appserver 调用url 微信服务器 获取accesstoken
        const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appID}&secret=${appsecret}`;
        /*
         *request request-promise-native
         * */
        return new Promise((resolve, reject) => {
            rp({method: 'GET', url, json: true}).then(res => {
                console.log(res);

                /*
                 *
                 * { access_token:
                 '37_KHSv4Qg19iQWhJAFWdJZrqGexExBPrUfWq1tpieUiAjn71KZvmNyn0vb7pehsmNr_0TcAuPyKTj_VyZ1LLws7vgMdJgzXg8vfXS7zw88gZffKz6vBT8vctEQD5BNSK_qwJEijtmkjAaiRar_OVXaAFAHOQ',
                 expires_in: 7200 }
                 * */
                //有效的accesstoken 2小时内
                res.expires_in = Date.now() + (res.expires_in - 300) * 1000;

                resolve(res)
            }).catch(err => {
                console.log(err);
                reject('getAccessToken??????' + err)
            })
        });

    }

    /*
     * 保存accessToken
     * */
     saveAccessToken(accessToken) {
        accessToken = JSON.stringify(accessToken);

        return new Promise((resolve, reject) => {
            writeFile('./accessToken.txt', accessToken, err => {
                if (!err) {
                    console.log("保存成功");
                    resolve();
                } else {
                    reject("saveAccessToken??????????" + err);
                }
            })
        })

    }


    /*
     * ???accessToken
     * */
     readAccessToken() {
        //读取txt 如果没有就创建accessToken
        return new Promise((resolve, reject) => {
            readFile('./accessToken.txt', accessToken, err, data=> {
                if (!err) {
                    console.log("?????????");
                    // ????????js????
                    data = JSON.parse(data);
                    resolve(data);
                } else {
                    reject("readAccessToken??????" + err);
                }
            })
        })

    }

    /*
     * 验证accessToken 是否过期
     * */
    isValidAccessToken(data) {
        if (!data && !data.access_token && !data.expires_in) {
            return false;
        }

        return data.expires_in > Date.now();
    }


    fetchAccessToke() {
        if (this.access_token && this.expires_in && this.isValidAccessToken(this)) {
            return Promise.resolve({
                access_token: this.access_token,
                expires_in: this.expires_in
            })
        }
        return this.readAccessToken()
            .then(async res => {
                //有效
                //直接获取
                if (this.isValidAccessToken(res)) {
                    return Promise.resolve(res);
                } else {
                    //??????
                    //重新获取accesstoken
                    const res = await this.getAccessToken();
                    await this.saveAccessToken(res);
                    return Promise.resolve(res);
                }

            }).catch(async err => {
                const res = await this.getAccessToken();
                await this.saveAccessToken(res);
                return Promise.resolve(res);
            })
            .then(res => {
                this.access_token = res.access_token;
                this.expires_in = res.expires_in;
                return Promise.resolve(res)
            })


    }


    creatMenu(menu) {
        return new Promise(async (resolve, reject) => {

            try {
                //获取ACCESS_TOKEN
                const data = await this.fetchAccessToke();

                //headers:{"content-type":'application/json'}

                console.log("menu:" + iconv.encode(JSON.stringify(menu), "utf8"));


                const url = `https://api.weixin.qq.com/cgi-bin/menu/create?access_token=${data.access_token}`;
                const result = rp({
                    method: 'POST', json: true, url: url, body: menu,
                    headers: {"content-type": 'application/json;charset:gbk'} // ????????????????? }


                });
                resolve(result);
            } catch (e) {
                reject("creatMenu??????????" + e);
            }
        })
    }

     deleteMenu() {
        return new Promise(async(resolve, reject) => {

            try {
                //删除ACCESS_TOKEN
                const data = await this.fetchAccessToke();
                const url = `https://api.weixin.qq.com/cgi-bin/menu/delete?access_token=${data.access_token}`;
                const result = rp({method: 'POST', url, json: true});
                resolve(result);
            } catch (e) {
                reject("deleteMenu??????????" + e)
            }

        })
    }

}


//(async () =>{
//    const  w = new  Wechat();
//    let resule = await  w.deleteMenu();
//    console.log(resule);
//     resule = await w.creatMenu(menu);
//    console.log(resule)
//})();

module.exports = wechat;

//module.exports = wechat;


