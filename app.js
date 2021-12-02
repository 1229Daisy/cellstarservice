
const axios = require('axios')
const Transaction = require("mongoose-transactions");
let xlsx = require('xlsx')
const cors = require('cors')
var express = require('express');
let https = require("https");
var mongoose = require('mongoose');
var bodyParser = require("body-parser");
var path = require('path');
var request = require('request');
var fs = require('fs');
var log4js = require('log4js');
const child = require('child_process')
var app = express();
var wkhtmltopdf = require('wkhtmltopdf');
var session = require('express-session');
var http = require('http');
const formidable = require('formidable');
const multer = require('multer')
var readline = require('readline');
app.use(multer({ storage:  multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "public/upload");
    },
    filename: function (req, file, cb) {
        let fileFormat = (file.originalname).split(".");
        cb(null,  Date.now() + "." + fileFormat[fileFormat.length - 1]);

    }
  })}).any())

    //阿里云短信接口调用
const SMSClient = require('@alicloud/sms-sdk');
const os = require('os')
let platform = os.platform()
const { Console } = require('console');
const { parse } = require('path');
let accessKeyId = ""
let secretAccessKey = ""
const appid = "" //开发者的appid
const appsecret = ""//开发者的appsecret 登入小程序公共平台内查看

let smsClient = new SMSClient({
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
    endpoint: 'https://dysmsapi.aliyuncs.com',
    apiVersion: '2017-05-25'
});
//错误日志配置
log4js.configure({
    appenders: {
        access: { type: 'dateFile', filename: 'log/access.log', pattern: '-yyyy-MM-dd' },
        app: { type: 'file', filename: 'log/app.log', maxLogSize: 10485760, numBackups: 3 },
        errorFile: { type: 'file', filename: 'log/errors.log' },
        errors: { type: 'logLevelFilter', level: 'error', appender: 'errorFile' }
    },
    categories: {
        default: { appenders: ['app', 'errors'], level: 'info' },
        http: { appenders: ['access'], level: 'info' }
    }
});
var logger = log4js.getLogger('normal');
logger.level = 'DEBUG ';
app.use(log4js.connectLogger(logger, { level: log4js.levels.DEBUG }));


let options = {
    flags: 'a', // append模式
    encoding: 'utf8', // utf8编码
};

let stdout = fs.createWriteStream(__dirname + '/access.log', options);
let stderr = fs.createWriteStream(__dirname + '/access.log', options);
let console = new Console({ stdout: stdout, stderr: stderr });

app.use(session({
    secret: "weird sheep",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 },

}))

//设置views的目录,__dirname全局变量表示当前执行脚本所在的目录
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs'); //设置渲染引擎
app.set('host', "https://app.cell-stars.com")
app.use("/public", express.static(path.join(__dirname, 'public')));
app.use("/BQvnRcT01J.txt", express.static(path.join(__dirname, '/BQvnRcT01J.txt')));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

//设置全局的变量url供模板ejs引用
//app.locals会在整个生命周期中起作用；而res.locals只会有当前请求中起作用
app.locals["url"] = "https://app.cell-stars.com"

   
mongoose.connect("mongodb://localhost:27017/cellstar", { useNewUrlParser: true, useUnifiedTopology: true }, function(err, db) {
    if (err) console.info(err);
    console.log("Connected to mongodb Database");

})



//1.根据规则创建集合实例User表
let User = mongoose.model('User', new mongoose.Schema({
    created:{ type: String, trim: true },
    clientname:{ type: String, trim: true },
    phone: { type: String, trim: true },
    password: { type: String, trim: true },
    constractnum:{ type: String, trim: true },
    signingtime:{ type: String, trim: true },
    saveyear: { type: String, trim: true },
    cell:{ type: String, trim: true },
    savestatus:{ type: String, trim: true },
    location:{ type: String, trim: true },
    leftyear:{ type: String, trim: true },
    validity:{ type: String, trim: true },
}))
User.createCollection()
//2.根据规则创建集合实例Reserve表
let Reserve = mongoose.model('Reserve', new mongoose.Schema({
    clientname:{ type: String, trim: true },
    reservedate: { type: String, trim: true },
    item: { type: String, trim: true },
    usedate:{ type: String, trim: true },
    
}))
Reserve.createCollection()
//3.根据规则创建集合实例Report表
let Report = mongoose.model('Report', new mongoose.Schema({
    phone:{ type: String, trim: true },
    physical: { type: String, trim: true }, //体检报告
    immunity: { type: String, trim: true },//免疫力评估
    cellsave:{ type: String, trim: true },//细胞存储
    celltest:{ type: String, trim: true },//细胞质检
    inventory:{ type: String, trim: true },//省库查询
}))
Report.createCollection()

let accessurl = []
https.createServer({ key: fs.readFileSync("./cell-stars_com.key"), cert: fs.readFileSync("./cell-stars_com.pem") }, app).listen(443, () => {
    console.log('Server listening on port 443!')
        //链接mysql数据库后，启动http,要先获取到数据才进入http
    accessurl.push("/admin/loginview")
});

//登录拦截器，必须放在静态资源声明之后、路由导航之前(中间件)
app.use(function(req, res, next) {
    let url = req.path
    let user = req.session.user //记录登录的信息
    console.log("backend app.js:" + url)
    console.info(user)
    if (/\/admin\/.+/.test(url)) {
        //accessurl.indexOf(url)!=-1用来判断url在不在该数组里面，如果在!=-1就放行，=-1就拦截
        if (accessurl.indexOf(url) != -1) { next() } else if (url == "/admin/login") {
            fs.readFile(__dirname + '/account.txt', 'utf-8', function(err, data) {
                if (err) console.info(err)
                let username = data.slice(0, 5)
                let password = data.slice(5, 16)
                console.info(username)
                console.info(password)
                if (req.body.username == username && req.body.password == password) {
                    let user = {}
                    user.username = username
                    user.password = password
                    req.session.user = user
                    next()
                } else {
                    console.info("请重新登录")
                    return res.redirect('/admin/loginview')
                }
            });
        } else if (url != "/admin/loginview" && !user) {
            console.info("请重新登录")
            return res.redirect("/admin/loginview")
        } else if (url == "/admin/loginview" && user) {
            next()
        } else if (user) { next() }
    } else {
        next()
    }

});
//返回更新信息页面数据
app.post("/admin/user/search", (req, res) => {
    let page = parseInt(req.body.page)-1;//page当前页
    let row = parseInt(req.body.rows);//页面最多几条
    let sql={}
    if (req.body.clientname) {
        if (!sql.hasOwnProperty("clientname")) {sql.clientname = {} }
        sql.clientname.$regex = new RegExp(req.body.clientname)
    }
    console.info(sql)

    User.countDocuments(sql, (err, total) => {
        User.find(sql,(err, rows) => {
            if (err) console.info(err)
            let data = {}
                data.total = total
                data.rows = rows 
                res.json(data)
           console.info(data)
            
        }).sort({ "_id": -1 }).skip(row * page).limit(row)
    })
    
})
//返回预约信息页面数据
app.post("/admin/reserve/message", (req, res) => {
    let page = parseInt(req.body.page)-1;//page当前页
    let row = parseInt(req.body.rows);//页面最多几条
    

    Reserve.countDocuments({}, (err, total) => {
        Reserve.find({},(err, rows) => {
            if (err) console.info(err)
            let data = {}
                data.total = total
                data.rows = rows 
                res.json(data)
           
            
        }).sort({ "_id": -1 }).skip(row * page).limit(row)
    })
    
})
//更新页面修改下拉框状态操作
app.post("/admin/user/updatestatus", (req, res) => {
    let id = req.body.id
    let validity = req.body.validity
    console.info(req.body)
        //查询数据库数据
    User.updateOne({ "_id": id }, { $set: { validity: validity } }, function(err, result) {
        if (err) console.info(err)
        res.send("success")
    })
})
//个人中心信息表单的保存与更新
app.post("/admin/user/center/update", async (req, res)=> {
    console.info(req.body)
  
    let usercenter={}
    usercenter.constractnum= req.body.constractnum
    usercenter.clientname= req.body.clientname
    usercenter.signingtime= req.body.signingtime
    usercenter.saveyear= req.body.saveyear
    usercenter.cell= req.body.cell
    usercenter.savestatus= req.body.savestatus
    usercenter.location= req.body.location
    usercenter.leftyear= req.body.leftyear
    await User.updateOne({ phone: req.body.phone }, { $set: usercenter})
    await res.send("success")

});
//添加个人中心信息app.all接受get跟post请求
app.all('/admin/add/client/message', (req, res) => {
User.findOne({_id:req.query.id}, function(err, usercenter) {
    console.info(usercenter)
    res.render('back/member-usercenter-form', { "usercenter": usercenter }) //把数据传递给客户端页面
})
})

//小程序首页信息展示
app.post("/client/index/message", (req, res) => {
    User.findOne({ password: req.body.password, phone: req.body.phone }, function(e, data) {
         if (e) console.info(e)
         res.send(data)
         console.info(data+"$$$$$$$$$$$")
     })
 })
    //添加个人中心信息app.all接受get跟post请求
    app.all('/admin/add/client/message', (req, res) => {
    console.info(req.query.id+"#")
    User.findOne({_id:req.query.id}, function(err, usercenter) {
        console.info(usercenter)
        res.render('back/member-usercenter-form', { "usercenter": usercenter }) //把数据传递给客户端页面
    })
    })

    //添加客户报告app.all接受get跟post请求
    app.all('/admin/upload/client/report', (req, res) => {
        let phone=req.query.phone
        Report.findOne({phone:phone},function(err,report){
            if(err){console.info(err)}
            else{
                res.render('back/member-upload-form',{phone:phone,report:report})
            }
            
        })
       
    })
    app.post("/admin/report/upload/physical",async (req, res)=>{
        let phone=req.body.phone
        let filename = req.files[0].path
        console.info(filename)
        let dbdata=await Report.findOne({phone:phone});
        let dbreport=dbdata?dbdata:{};
        dbreport.physical=filename;
        Report.findOneAndUpdate({phone:phone},dbreport,{ upsert: true }, function(err) {
            if(err){console.info(err)}
            else{res.send("success")}
         })
    });

    app.post("/admin/report/upload/immunity",async (req, res)=>{
        let phone=req.body.phone
        let filename = req.files[0].path
        console.info(filename)
        let dbdata=await Report.findOne({phone:phone});
        let dbreport=dbdata?dbdata:{};
        dbreport.immunity=filename;
        Report.findOneAndUpdate({phone:phone},dbreport,{ upsert: true }, function(err) {
            if(err){console.info(err)}
            else{res.send("success")}
         })
    });

    app.post("/admin/report/upload/cellsave",async (req, res)=>{
        let phone=req.body.phone
        let filename = req.files[0].path
        console.info(filename)
        let dbdata=await Report.findOne({phone:phone});
        let dbreport=dbdata?dbdata:{};
        dbreport.cellsave=filename;
        Report.findOneAndUpdate({phone:phone},dbreport,{ upsert: true }, function(err) {
            if(err){console.info(err)}
            else{res.send("success")}
         })
    });
    app.post("/admin/report/upload/celltest",async (req, res)=>{
        let phone=req.body.phone
        let filename = req.files[0].path
        console.info(filename)
        let dbdata=await Report.findOne({phone:phone});
        let dbreport=dbdata?dbdata:{};
        dbreport.celltest=filename;
        Report.findOneAndUpdate({phone:phone},dbreport,{ upsert: true }, function(err) {
            if(err){console.info(err)}
            else{res.send("success")}
         })
    });

    app.post("/admin/report/upload/inventory",async (req, res)=>{
        let phone=req.body.phone
        let filename = req.files[0].path
        console.info(filename)
        let dbdata=await Report.findOne({phone:phone});
        let dbreport=dbdata?dbdata:{};
        dbreport.inventory=filename;
        Report.findOneAndUpdate({phone:phone},dbreport,{ upsert: true }, function(err) {
            if(err){console.info(err)}
            else{res.send("success")}
         })
    })
    //小程序查看报告
    app.post("/client/check/report", (req, res) => {
        console.info(req.body.phone)
        Report.findOne({phone: req.body.phone}, function(e, data) {
            if (e) console.info(e)
            console.info(data+"&&&&")
            res.send(data)
        })
    })

//小程序用户注册信息并返回状态
app.post("/client/cellstar/adduser", function(req, res) {
    console.info("/client/cellstar/adduser:" + req.body)
        //保存生物学年龄的用户数据表到saveformEpiage数据
    User.findOne({ "phone": req.body.phone }, function(err, result) {
        if (!result) {
            new User(req.body).save((err, data) => {
                if (err) console.info(err)
                res.json({ "status": "success" })
            })
        } else {
            res.json({ "status": "fail" })
        }
    })
});
//保存小程序用户预约信息并返回状态
app.post("/client/cellstar/reserveform", function(req, res) {
    console.info("/client/cellstar/reserveform:" + req.body)
        //保存生物学年龄的用户数据表到saveformEpiage数据
        let booking={}
        booking.clientname=req.body.clientname
        booking.reservedate=req.body.reservedate
        if(req.body.item=='0'){
            booking.item='体检'
        }else if(req.body.item=='1'){
            booking.item='免疫力评估'
        }else if(req.body.item=='2'){
            booking.item='干细胞干预'
        }else if(req.body.item=='3'){
            booking.item='免疫细胞干预'
        }else if(req.body.item=='4'){
            booking.item='续存'
        }else if(req.body.item=='5'){
            booking.item='DNA甲基化早筛'
        }
        booking.usedate=req.body.usedate
    Reserve.findOne({ "phone": req.body.phone }, function(err, result) {
        if (!result) {
            new Reserve(booking).save((err, data) => {
                if (err) console.info(err)
                res.json({ "status": "success" })
            })
        } else {
            res.json({ "status": "fail" })
        }
    })
});


//小程序端用户注册发送验证码
app.post('/client/user/sms', (req, res) => {
    console.info(req.query.phone)
        //let phone= req.query.phone
    let phone = req.body.phone
    let code = Math.random().toString().slice(-6)
        // 开始发送短信
    smsClient.sendSMS({
        PhoneNumbers: phone,
        "SignName": "赛斯达",
        "TemplateCode": "SMS_228838279",
        // "SignName": "Epidial",
        // "TemplateCode": "SMS_159965409",
        "TemplateParam": `{"code":'${code}'}`, // 短信模板变量对应的实际值，JSON格式
    }).then(result => {
        console.log("result", result)
        let { Code } = result;
        if (Code == 'OK') {
            res.json({ code: code, status: 'success' })
        }
    }).catch(err => {
        console.log(err);
        res.json({ code: code, status: 'fail' })
    })
})



//接受小程序端登录页面传过来的用户名跟密码
app.post("/client/user/login", (req, res) => {
    console.info(req.body.phone+req.body.password+"*********")
    User.findOne({ phone: req.body.phone,password: req.body.password }, function(err, result) {
        console.info(result+"*")
        if (err) console.info(err)
        if (!result) {
            res.json({ "status": "error" })
        } else {
            console.info(result)
            res.json({ "status": "success" })
        }
    })
})
//小程序重设密码
app.post("/client/user/finduser", (req, res) => {
        console.info(req.body.phone)
        User.findOne({ "phone": req.body.phone }, function(e, data) {
            if (e) console.info(e)
            console.info(data)
            res.send(data)
        })
    })
//小程序showname
    app.post("/client/username/show", (req, res) => {
        console.info(req.body.phone)
        User.findOne({ phone: req.body.phone,password: req.body.password}, function(e, data) {
            if (e) console.info(e)
            console.info(data+"^^")
            res.send(data)
        })
    })
    //接受小程序端登录页面传过来的用户名跟密码 重设密码
app.post("/client/user/resetpwd", (req, res) => {
        console.info(req.body.phone)
        console.info(req.body.password)
        User.findOne({ "phone": req.body.phone }, function(err, result) {
            if (err) console.info(err)
            if (!result) {
                res.json({ "status": "error" })
            } else {
                User.updateOne({ "phone": req.body.phone }, { $set: { password: req.body.password, } }, function(err, status) {
                    if (err) console.info(err)

                    res.json({ "status": "success" })
                })



            }
        })
    })




//接受微信小程序端传过来的appid,secret,code返回openid给小程序
app.get("/cellstar/mini/login", (req, res) => {
    const code = req.query.code //拿到传过来的code
        //调用 auth.code2Session接口，换取用户唯一标识 OpenID 和 会话密钥 session_key
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${appsecret}&js_code=${code}&grant_type=authorization_code`
    request(url, (req, response, body) => {
        res.send(body) //将请求到的 OpenID与 session_key 返回给小程序页面js文件
    })


})





app.get('/admin/loginview', (req, res) => res.render('back/login'))
app.get("/admin/manager", (req, res) => {

    //查数据库获取数据，拼接成json格式传递到客户端
    res.render('back/manager')
        //传值到index.jhtml
        //项目路径/
        // res.sendFile(path.join(__dirname, "views/back", 'index.html'), {"username":"wuqiwei"});
})

app.post("/admin/login", (req, res) => {
    console.info("---------------------")
    res.redirect('/admin/manager')
})
app.get("/admin/welcome", (req, res) => res.render('back/welcome'))
app.get("/admin/article", (req, res) => res.render('back/article-list'))





//返回更新信息页面
app.get("/admin/user/users", (req, res) => {
    //查询Epiage数据库数据,显示所有barcode
    let vdata = {}
    User.find(vdata, function(err, result) {
        res.render('back/member-list-users', { "data": result, "count": result.length }) //把数据传递给客户端页面
    }).sort({ "_id": -1 }).skip(0).limit(50)

})
//返回预约信息页面
app.get("/admin/user/reserve", (req, res) => {
    //查询Epiage数据库数据,显示所有barcode
    let vdata = {}
    Reserve.find(vdata, function(err, result) {
        res.render('back/member-list-reserve') //把数据传递给客户端页面
    })

})
//更新信息页面删除一条数据
app.post("/admin/user/del", (req, res) => {
    // console.log("删除的id是： " + req.body.id)
    User.deleteOne({ _id: req.body.id }, function(err, result) {
        if (err) console.info(err)
        res.send("success")
        
    })
})

module.exports = app;

