
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
var mysql = require('mysql');
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
app.use(multer({ dest: './tmp/' }).any())
    //阿里云短信接口调用
const SMSClient = require('@alicloud/sms-sdk');
const os = require('os')
let platform = os.platform()
const { Console } = require('console');
const { parse } = require('path');
let accessKeyId = "LTAI5tCfY3LXs6TPg8H3eUVx"
let secretAccessKey = "YmRSa7qAaSphVglMlfcDGsmlaX9pO9"
const appid = "wxbf96208a281796fd" //开发者的appid
const appsecret = "a9c951c0557ada4ef5ca91b7a04a821f"//开发者的appsecret 登入小程序公共平台内查看


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
// let console = new Console({ stdout: stdout, stderr: stderr });




app.use(session({
    secret: "weird sheep",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 },

}))

//设置views的目录,__dirname全局变量表示当前执行脚本所在的目录
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs'); //设置渲染引擎
app.set('host', "https://bainuo.beijingepidial.com")
app.use("/public", express.static(path.join(__dirname, 'public')));
app.use("/BQvnRcT01J.txt", express.static(path.join(__dirname, '/BQvnRcT01J.txt')));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

//设置全局的变量url供模板ejs引用
//app.locals会在整个生命周期中起作用；而res.locals只会有当前请求中起作用
app.locals["url"] = "https://bainuo.beijingepidial.com"

   
mongoose.connect("mongodb://localhost:27017/epireport", { useNewUrlParser: true, useUnifiedTopology: true }, function(err, db) {
    if (err) console.info(err);
    console.log("Connected to mongodb Database");

})

//泛癌数据库及表
let Generic = mongoose.model('Generic', new mongoose.Schema({
    sampleid: { type: String, trim: true },
    pdf: { type: String, trim: true },
    tel: { type: String, trim: true },
    mval: Number,
    chance: Number,
    date: { type: String, trim: true },
    recdate: { type: String, trim: true }, //样本接收日期
    htmlpage: String,
    reportPage: String,
    status: String,
    pdfbuildate:String,
    issms:{ type: Number, default: 0 }  //是否已经发送短信提醒给用户
}))
Generic.createCollection()

let Genericuser = mongoose.model('Genericuser', new mongoose.Schema({
    sampleid: { type: String, trim: true },
    username: { type: String, trim: true },
    post:{ type: String, trim: true },
    sex: { type: String, trim: true },
    age: { type: String, trim: true },
    tel: String,
    idCard: String,
    created: String,
}))
Genericuser.createCollection()

let GenericLib = mongoose.model('GenericLib', new mongoose.Schema({
    sampleid: { type: String, trim: true },
    name: { type: String, trim: true },
    post:{ type: String, trim: true },
    created: String,
    status: String
}))
GenericLib.createCollection()
//泛癌报告核验单
let GenericReview = mongoose.model('GenericReview', new mongoose.Schema({
    sampleid: { type: String, trim: true },
    username: { type: String, trim: true },
    sex: { type: String, trim: true },
    age: { type: String, trim: true },
    mval: { type: String, trim: true },
    collectionDate: { type: String, trim: true },
    reciveDate: { type: String, trim: true },
    probability: { type: String, trim: true },
    isNewData: { type: String, trim: true },
    inventoryStatus: { type: String, trim: true },
    saveStatus: { type: String, trim: true },
    dataStatus: { type: String, trim: true },
    testStatus: { type: String, trim: true },
    uploadDate: { type: String, trim: true },
    tel: { type: String, trim: true },

}))
GenericReview.createCollection()
//2.创建Liver集合规则
//3.根据规则创建集合实例Liver
let Liver = mongoose.model('Liver', new mongoose.Schema({
    sampleid: {trim: true,type: String},
    pdf: { type: String, trim: true },
    tel: { type: String, trim: true },
    mval: Number,
    chance: Number,
    date: { type: String, trim: true },//样本采集日期
    recdate: { type: String, trim: true }, //样本接收日期
    htmlpage: String,
    reportPage: String,
    status: String,
    post: { type: String, trim: true },
    issms:{ type: Number, default: 0 }, //是否已经发送短信提醒给用户
    pdfbuildate:String,
    liveruser: {
        type: mongoose.Schema.Types.ObjectId,
        ref : 'Liveruser'
    }
   
}))
Liver.createCollection()

let Liveruser = mongoose.model('Liveruser', new mongoose.Schema({
    sampleid:  {trim: true,type: String},
    username: { type: String, trim: true },
    tel: { type: String, trim: true },
    idCard: { type: String, trim: true },
    sex: { type: String, trim: true },
    created:{ type: String, trim: true },
    age: { type: String, trim: true },
    post:{ type: String, trim: true }
}))
Liveruser.createCollection()


// Liver.findOne({sampleid: ''}) 21LV474EF
//        .populate({
//            path: 'school',
//            populate: {path: 'city'}
//        })
//        .exec(function (err, data) {
//           console.log(data.name + ' 所在学校为：' + data.school.name + "，所在城市为：" + data.school.city.name);
// })

let LiverLib = mongoose.model('LiverLib', new mongoose.Schema({
    sampleid: { type: String, trim: true },
    name: { type: String, trim: true },
    created:{ type: String, trim: true }, 
    post:{ type: String, trim: true },
    status: { type: String, trim: true }
}))
LiverLib.createCollection()
//肝癌报告核验单
let LiverReview = mongoose.model('LiverReview', new mongoose.Schema({
    sampleid: { type: String, trim: true },
    username: { type: String, trim: true },
    sex: { type: String, trim: true },
    age: { type: String, trim: true },
    mval: { type: String, trim: true },
    collectionDate: { type: String, trim: true },
    reciveDate: { type: String, trim: true },
    probability: { type: String, trim: true },
    isNewData: { type: String, trim: true },
    inventoryStatus: { type: String, trim: true },
    saveStatus: { type: String, trim: true },
    dataStatus: { type: String, trim: true },
    testStatus: { type: String, trim: true },
    uploadDate: { type: String, trim: true },
    tel: { type: String, trim: true },

}))
LiverReview.createCollection()

//宫颈癌数据库
let Hpv = mongoose.model('Hpv', new mongoose.Schema({
    sampleid: { type: String, trim: true },
    pdf: { type: String, trim: true },
    tel: { type: String, trim: true },
    mval: Number,
    chance: Number,
    date: { type: String, trim: true },
    recdate: { type: String, trim: true }, //样本接收日期
    htmlpage: String,
    reportPage: String,
    status: String,
    pdfbuildate:String,
    issms:{ type: Number, default: 0 }  //是否已经发送短信提醒给用户
}))
Hpv.createCollection()

let Hpvuser = mongoose.model('Hpvuser', new mongoose.Schema({
    sampleid: { type: String, trim: true },
    username: { type: String, trim: true },
    post:{ type: String, trim: true },
    sex: { type: String, trim: true },
    tel: String,
    idCard: String,
    created: String,
    age: String,
}))
Hpvuser.createCollection()

let HpvLib = mongoose.model('HpvLib', new mongoose.Schema({
    sampleid: { type: String, trim: true },
    name: { type: String, trim: true },
    post:{ type: String, trim: true },
    created: String,
    status: String
}))
HpvLib.createCollection()
//宫颈癌癌报告核验单
let HpvReview = mongoose.model('HpvReview', new mongoose.Schema({
    sampleid: { type: String, trim: true },
    username: { type: String, trim: true },
    sex: { type: String, trim: true },
    age: { type: String, trim: true },
    mval: { type: String, trim: true },
    collectionDate: { type: String, trim: true },
    reciveDate: { type: String, trim: true },
    probability: { type: String, trim: true },
    isNewData: { type: String, trim: true },
    inventoryStatus: { type: String, trim: true },
    saveStatus: { type: String, trim: true },
    dataStatus: { type: String, trim: true },
    testStatus: { type: String, trim: true },
    uploadDate: { type: String, trim: true },
    tel: { type: String, trim: true },

}))
HpvReview.createCollection()

let EpiageLib = mongoose.model('EpiageLib', new mongoose.Schema({
    name: { type: String, trim: true },
    barcode: { type: String, trim: true },
    post:{ type: String, trim: true },
    createtime: String,
    status: String,
}))
EpiageLib.createCollection()
    //2.创建生物学年龄Epiage集合规则
    //3.根据规则创建集合实例Epiage
let Epiage = mongoose.model('Epiage', new mongoose.Schema({
    sampleid: { type: String, trim: true },
    username: { type: String, trim: true },
    chroage: { type: Number, trim: true },
    epiage: { type: Number, trim: true },
    accuracy: { type: Number, trim: true },
    status: String,
    pdf: String,
    tel: String,
    date: String,
    colldate:String,
    recdate: { type: String, trim: true }, //样本接收日期
    htmlpage: String,
    reportPage: String,
    post: { type: String, trim: true },
    issms:{ type: Number, default: 0 },  //是否已经发送短信提醒给用户
    pdfbuildate:String,
}))
Epiage.createCollection()
let Epiageuser = mongoose.model('Epiageuser', new mongoose.Schema({
    sampleid: { type: String, trim: true },
    username: { type: String, trim: true },
    sex: { type: String, trim: true },
    tel: String,
    idCard: String,
    created: String,
    age: String,
    checktime: String,
    post:{ type: String, trim: true }
}))
Epiageuser.createCollection()
//生物学年龄报告核验单
let EpiageReview = mongoose.model('EpiageReview', new mongoose.Schema({
    sampleid: { type: String, trim: true },
    username: { type: String, trim: true },
    sex: { type: String, trim: true },
    tel: { type: String, trim: true },
    chroage: { type: String, trim: true },
    epiage: { type: String, trim: true },
    accuracy: { type: String, trim: true },
    collectionDate: { type: String, trim: true },
    reciveDate: { type: String, trim: true },
    isNewData: { type: String, trim: true },
    inventoryStatus: { type: String, trim: true },
    saveStatus: { type: String, trim: true },
    dataStatus: { type: String, trim: true },
    testStatus: { type: String, trim: true },
    uploadDate: { type: String, trim: true },
    
}))
EpiageReview.createCollection()

//3.根据规则创建集合实例EpiageUser表
let User = mongoose.model('User', new mongoose.Schema({
    username: { type: String, trim: true },
    phone: { type: String, trim: true },
    password: { type: String, trim: true },
}))
User.createCollection()
    //1.node 链接 mysql数据库 
let connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'hdreportdb',

});
let accessurl = []
    //链接mysql数据库后，启动http,要先获取到数据才进入http
connection.connect(function(err) {
    accessurl.push("/admin/epihpv/epihpvreport")
    accessurl.push("/admin/loginview")
    accessurl.push("/admin/epihpv/hpvinserval")
    accessurl.push("/admin/epihpv/inserval")
    accessurl.push("/admin/epihpv/chechpval")
    accessurl.push("/admin/liver/build/liver/pdf")
    accessurl.push("/admin/epiliver/checkliverval")
    accessurl.push("/admin/liver/liverhtml")
    accessurl.push("/admin/epiage/html")
    accessurl.push("/admin/epiage/report")
    accessurl.push("/admin/epiage/adduser")
    accessurl.push("/admin/liver/report")
    accessurl.push("/admin/generic/report")
    accessurl.push("/admin/hpv/report")
    accessurl.push("/admin/hpv/buildliverpdf")
    accessurl.push("/admin/generic/client/sms")
    accessurl.push("/admin/liver/client/sms")
    accessurl.push("/admin/epiage/client/sms")
    if (err) {
        return console.error('error: ' + err.message);
    } else {
        //访问http协议
        //https协议
	https.createServer({ key: fs.readFileSync("./bainuo.beijingepidial.com.key"), cert: fs.readFileSync("./bainuo.beijingepidial.com.pem") }, app).listen(443, () => {
            console.log('Server listening on port 443!')
        });
    }

    console.log('Connected to the MySQL server.');
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
app.post("/admin/user/search", (req, res) => {
    let index = parseInt(req.body.current) - 1
    let sql={}
    if (req.body.tel) {
        if (!sql.hasOwnProperty("phone")) {sql.phone = {} }
        sql.phone.$regex = new RegExp(req.body.tel)
    }
    
    if (req.body.username) {
        if (!sql.hasOwnProperty("username")) {sql.username = {} }
        sql.username.$regex = new RegExp(req.body.username)
    }
    console.info(sql)

    User.countDocuments(sql, (err, count) => {
        User.find(sql,(err, users) => {
            if (err) console.info(err)
            let data = {}
            data.users = users
            data.count = count
            res.send(data)
           
            
        }).sort({ "_id": -1 }).skip(50 * index).limit(50)
    })
    
})
//泛癌库存barcode批量查询
app.post("/admin/generic/lab/search", (req, res) => {
    let page = parseInt(req.body.page)-1;//page当前页
    let row = parseInt(req.body.rows);//页面最多几条
    console.info(req.body)
    let sql = {}
    if (req.body.barcode) {
        let barcodebox = []
        req.body.barcode.split("\n").forEach((element) => {
            if (element != "") {
                barcodebox.push(new RegExp([element], 'i'))
            }
        })
        if (barcodebox.length > 0) {
            sql.sampleid = {}
            sql.sampleid.$in = barcodebox
        }
    }

  
    GenericLib.countDocuments(sql , (err, total) => {
        GenericLib.find(sql, (err, rows) => {
            if (err) console.info(err)
            let data = {}
                data.total = total
                data.rows = rows 
                res.json(data)
            
            
        }).sort({ "_id": -1 }).skip(row * page).limit(row)
    })

})
//肝癌库存barcode批量查询
app.post("/admin/liver/lab/search", (req, res) => {
    let page = parseInt(req.body.page)-1;//page当前页
    let row = parseInt(req.body.rows);//页面最多几条
    console.info(req.body)
    // let barcodebox = []
    // req.body.barcode.split("\n").forEach((element) => {
    //     if (element != "") {
    //         barcodebox.push(new RegExp([element], 'i'))
    //     }
    // })
    let sql = {}
    if (req.body.barcode) {
        let barcodebox = []
        req.body.barcode.split("\n").forEach((element) => {
            if (element != "") {
                barcodebox.push(new RegExp([element], 'i'))
            }
        })
        if (barcodebox.length > 0) {
            sql.sampleid = {}
            sql.sampleid.$in = barcodebox
        }
    }

  
    LiverLib.countDocuments(sql , (err, total) => {
        LiverLib.find(sql, (err, rows) => {
            if (err) console.info(err)
            let data = {}
                data.total = total
                data.rows = rows 
                res.json(data)
            
            
        }).sort({ "_id": -1 }).skip(row * page).limit(row)
    })

    // let index = parseInt(req.body.current) - 1
    // console.info(req.body.barcode)
    // let barcodebox = []
    // req.body.barcode.split("\n").forEach((element) => {
    //     if (element != "") {
    //         barcodebox.push(new RegExp([element], 'i'))
    //     }
    // })
    //  LiverLib.countDocuments({ sampleid:{ $in: barcodebox } }, (err, count) => {
    //     LiverLib.find({ sampleid: { $in: barcodebox } }, (err, liverlibs) => {
    //         if (err) console.info(err)
    //         let data = {}
    //         data.liverlibs = liverlibs
    //         data.count = count
    //         res.send(data)
            
            
    //     }).sort({ "_id": 1 }).skip(50 * index).limit(50)
    // })
  
})
//宫颈癌库存barcode模糊查询
app.post("/admin/hpv/lab/search", (req, res) => {
    let regexp = new RegExp(req.body.barcode, 'i')
    HpvLib.find({ sampleid: { $regex: regexp } }, function(err, hpvlibs) {
        if (err) console.info(err)
        res.send(hpvlibs)
    })
})
//生物学年龄库存barcode模糊查询
app.post("/admin/epiage/lab/search", (req, res) => {
    let page = parseInt(req.body.page)-1;//page当前页
    let row = parseInt(req.body.rows);//页面最多几条
    console.info(req.body)
    // let barcodebox = []
    // req.body.barcode.split("\n").forEach((element) => {
    //     if (element != "") {
    //         barcodebox.push(new RegExp([element], 'i'))
    //     }
    // })
    let sql = {}
    if (req.body.barcode) {
        let barcodebox = []
        req.body.barcode.split("\n").forEach((element) => {
            if (element != "") {
                barcodebox.push(new RegExp([element], 'i'))
            }
        })
        if (barcodebox.length > 0) {
            sql.barcode = {}
            sql.barcode.$in = barcodebox
        }
    }

  
    EpiageLib.countDocuments(sql , (err, total) => {
        EpiageLib.find(sql, (err, rows) => {
            if (err) console.info(err)
            let data = {}
                data.total = total
                data.rows = rows 
                res.json(data)
            
            
        }).sort({ "_id": -1 }).skip(row * page).limit(row)
    })
 
  
})
//生物学年龄后台报告页面通过barcode,精确度范围查询
app.post("/admin/epiage/report/search", (req, res) => {
    let page = parseInt(req.body.page)-1;//page当前页
    let row = parseInt(req.body.rows);//页面最多几条
    var order=req.body.order
    let ordername=req.body.sort
    console.info(req.body)
    let sql = {}
    if (req.body.sampleid) {
        let sampleidbox = []
        req.body.sampleid.split("\n").forEach((element) => {
            if (element != "") {
                sampleidbox.push(new RegExp([element], 'i'))
            }
        })
        if (sampleidbox.length > 0) {
            sql.sampleid = {}
            sql.sampleid.$in = sampleidbox
        }
    }
    if (req.body.status) {
        sql.status = req.body.status
    }
    if (req.body.accuracyval_lt) {
        if (!sql.hasOwnProperty("accuracy")) {
            sql.accuracy = {}
        }
        sql.accuracy.$gte = parseFloat(req.body.accuracyval_lt)
    }
    if (req.body.accuracyval_gt) {
        if (!sql.hasOwnProperty("accuracy")) { sql.accuracy = {} }
        sql.accuracy.$lte = parseFloat(req.body.accuracyval_gt)
    }
    if(req.body.sms){
        sql.issms = parseInt(req.body.sms)
        }
        if(req.body.pdf){
            if (!sql.hasOwnProperty("pdf")) {
                sql.pdf = {}
            }
            if(req.body.pdf=='undone'){
                sql.pdf.$exists = 'false'//该查询只返回那些 没有 包含 条目 字段的文档
            }else{
                sql.pdf.$exists = 'true'
            }
        
    }
    console.info(sql)
    if(ordername){
        if(ordername=='sampleid'){
            let sampleidorder=(order=='asc')?1:-1
            Epiage.countDocuments({}, (err, total) => {
                Epiage.find(sql, {sampleid:1,pdf:1,tel:1,chroage:1,epiage:1,accuracy:1,colldate:1,date:1,recdate:1,status:1,issms:1},(err, rows ) => {
                if (err) console.info(err)
    
                let data = {}
                data.total = total
                data.rows = rows 
                res.json(data)
                // console.info(data)
            }).sort({ "sampleid": sampleidorder }).skip(row * page).limit(row)
        })
    }
        if(ordername=='status'){
            let statusorder=(order=='asc')?1:-1
            Epiage.countDocuments({}, (err, total) => {
                Epiage.find(sql, {sampleid:1,pdf:1,tel:1,chroage:1,epiage:1,accuracy:1,colldate:1,date:1,recdate:1,status:1,issms:1},(err, rows ) => {
                if (err) console.info(err)
    
                let data = {}
                data.total = total
                data.rows = rows 
                res.json(data)
                // console.info(data)
            }).sort({ "status": statusorder}).skip(row * page).limit(row)
        })
    }
    if(ordername=='pdf'){
        let pdforder=(order=='asc')?1:-1
        Epiage.countDocuments({}, (err, total) => {
            Epiage.find(sql, {sampleid:1,pdf:1,tel:1,chroage:1,epiage:1,accuracy:1,colldate:1,date:1,recdate:1,status:1,issms:1},(err, rows ) => {
            if (err) console.info(err)

            let data = {}
            data.total = total
            data.rows = rows 
            res.json(data)
            // console.info(data)
        }).sort({ "pdf": pdforder}).skip(row * page).limit(row)
    })
     }
     if(ordername=='issms'){
        let issmsorder=(order=='asc')?1:-1
        Epiage.countDocuments({}, (err, total) => {
            Epiage.find(sql, {sampleid:1,pdf:1,tel:1,chroage:1,epiage:1,accuracy:1,colldate:1,date:1,recdate:1,status:1,issms:1},(err, rows ) => {
            if (err) console.info(err)

            let data = {}
            data.total = total
            data.rows = rows 
            res.json(data)
            // console.info(data)
        }).sort({ "issms": issmsorder}).skip(row * page).limit(row)
    })
     }
        
    }else{
        Epiage.countDocuments(sql, (err, total) => {
            Epiage.find(sql, {sampleid:1,pdf:1,tel:1,chroage:1,epiage:1,accuracy:1,colldate:1,date:1,recdate:1,status:1,issms:1},(err, rows) => {
                if (err) console.info(err)
    
                let data = {}
                data.total = total
                data.rows = rows 
                res.json(data)
                // console.info(data)
               
            }).sort({ "_id": -1 }).skip(row * page).limit(row)
        })
    }
    
   
})

//肝癌后台报告页面通过barcode,概率范围，M值范围查询
app.post("/admin/generic/report/search", (req, res) => {
    let page = parseInt(req.body.page)-1;//page当前页
    let row = parseInt(req.body.rows);//页面最多几条
    var order=req.body.order
    let ordername=req.body.sort
    // var start = (page-1)*row;//查询起始位置
    // var end = page*row-1
    let sql = {}
    if (req.body.sampleid) {
        let sampleidbox = []
        req.body.sampleid.split("\n").forEach((element) => {
            if (element != "") {
                sampleidbox.push(new RegExp([element], 'i'))
            }
        })
        if (sampleidbox.length > 0) {
            sql.sampleid = {}
            sql.sampleid.$in = sampleidbox
        }
    }
    if (req.body.status) {
        sql.status = req.body.status
    }
    if (req.body.mlval) {
        if (!sql.hasOwnProperty("mval")) {
            sql.mval = {}
        }
        sql.mval.$gte = parseFloat(req.body.mlval)
    }
    if (req.body.mrval) {
        if (!sql.hasOwnProperty("mval")) { sql.mval = {} }
        sql.mval.$lte = parseFloat(req.body.mrval)
    }
    if (req.body.clval) {
        if (!sql.hasOwnProperty("chance")) { sql.chance = {} }
        sql.chance.$gte = parseFloat(req.body.clval)
    }
    if (req.body.crval) {
        if (!sql.hasOwnProperty("chance")) { sql.chance = {} }
        sql.chance.$lte = parseFloat(req.body.crval)
    }
    if(req.body.sms){
            sql.issms = parseInt(req.body.sms)
    }
    if(req.body.pdf){
        if (!sql.hasOwnProperty("pdf")) {
            sql.pdf = {}
        }
        if(req.body.pdf=='undone'){
            sql.pdf.$exists = 'false'//该查询只返回那些 没有 包含 条目 字段的文档
        }else{
            sql.pdf.$exists = 'true'
        }
        
    }
    console.info(sql)
    Generic.createIndexes
    if(ordername){
        if(ordername=='sampleid'){
            let sampleidorder=(order=='asc')?1:-1
            Generic.countDocuments({}, (err, total) => {
                Generic.find(sql, {sampleid:1,pdf:1,tel:1,mval:1,chance:1,date:1,recdate:1,status:1,issms:1},(err, rows ) => {
                if (err) console.info(err)
    
                let data = {}
                data.total = total
                data.rows = rows 
                res.json(data)
                // console.info(data)
            }).sort({ "sampleid": sampleidorder }).skip(row * page).limit(row)
        })
    }
        if(ordername=='status'){
            let statusorder=(order=='asc')?1:-1
            Generic.countDocuments({}, (err, total) => {
                Generic.find(sql, {sampleid:1,pdf:1,tel:1,mval:1,chance:1,date:1,recdate:1,status:1,issms:1},(err, rows ) => {
                if (err) console.info(err)
    
                let data = {}
                data.total = total
                data.rows = rows 
                res.json(data)
                // console.info(data)
            }).sort({ "status": statusorder}).skip(row * page).limit(row)
        })
    }
        
    }else{
        Generic.countDocuments(sql, (err, total) => {
            Generic.find(sql, {sampleid:1,pdf:1,tel:1,mval:1,chance:1,date:1,recdate:1,status:1,issms:1},(err, rows) => {
                if (err) console.info(err)
    
                let data = {}
                data.total = total
                data.rows = rows 
                res.json(data)
                // console.info(data)
               
            }).sort({ "_id": -1 }).skip(row * page).limit(row)
        })
    }
})
//肝癌后台报告页面通过barcode,概率范围，M值范围查询
app.post("/admin/liver/report/search", (req, res) => {
    // let index = parseInt(req.body.current) - 1
    // let sampleidorder=req.body.sampleidorder
    // let statusorder=req.body.statusorder 
    let page = parseInt(req.body.page)-1;//page当前页
    let row = parseInt(req.body.rows);//页面最多几条
    var order=req.body.order
    let ordername=req.body.sort
    // var start = (page-1)*row;//查询起始位置
    // var end = page*row-1
    let sql = {}
    if (req.body.sampleid) {
        let sampleidbox = []
        req.body.sampleid.split("\n").forEach((element) => {
            if (element != "") {
                sampleidbox.push(new RegExp([element], 'i'))
            }
        })
        if (sampleidbox.length > 0) {
            sql.sampleid = {}
            sql.sampleid.$in = sampleidbox
        }
    }
    if (req.body.status) {
        sql.status = req.body.status
    }
    if (req.body.mlval) {
        if (!sql.hasOwnProperty("mval")) {
            sql.mval = {}
        }
        sql.mval.$gte = parseFloat(req.body.mlval)
    }
    if (req.body.mrval) {
        if (!sql.hasOwnProperty("mval")) { sql.mval = {} }
        sql.mval.$lte = parseFloat(req.body.mrval)
    }
    if (req.body.clval) {
        if (!sql.hasOwnProperty("chance")) { sql.chance = {} }
        sql.chance.$gte = parseFloat(req.body.clval)
    }
    if (req.body.crval) {
        if (!sql.hasOwnProperty("chance")) { sql.chance = {} }
        sql.chance.$lte = parseFloat(req.body.crval)
    }
    if(req.body.sms){
            sql.issms = parseInt(req.body.sms)
    }
    if(req.body.pdf){
        if (!sql.hasOwnProperty("pdf")) {
            sql.pdf = {}
        }
        if(req.body.pdf=='undone'){
            sql.pdf.$exists = 'false'//该查询只返回那些 没有 包含 条目 字段的文档
        }else{
            sql.pdf.$exists = 'true'
        }
        
    }
    console.info(sql)
    if(ordername){
        if(ordername=='sampleid'){
            let sampleidorder=(order=='asc')?1:-1
            Liver.countDocuments({}, (err, total) => {
            Liver.find(sql, {sampleid:1,pdf:1,tel:1,mval:1,chance:1,date:1,recdate:1,status:1,issms:1},(err, rows ) => {
                if (err) console.info(err)
    
                let data = {}
                data.total = total
                data.rows = rows 
                res.json(data)
                // console.info(data)
            }).sort({ "sampleid": sampleidorder }).skip(row * page).limit(row)
        })
    }
        if(ordername=='status'){
            let statusorder=(order=='asc')?1:-1
            Liver.countDocuments({}, (err, total) => {
            Liver.find(sql, {sampleid:1,pdf:1,tel:1,mval:1,chance:1,date:1,recdate:1,status:1,issms:1},(err, rows ) => {
                if (err) console.info(err)
    
                let data = {}
                data.total = total
                data.rows = rows 
                res.json(data)
                // console.info(data)
            }).sort({ "status": statusorder}).skip(row * page).limit(row)
        })
    }
    if(ordername=='pdf'){
        let pdforder=(order=='asc')?1:-1
        Liver.countDocuments({}, (err, total) => {
        Liver.find(sql, {sampleid:1,pdf:1,tel:1,mval:1,chance:1,date:1,recdate:1,status:1,issms:1},(err, rows ) => {
            if (err) console.info(err)

            let data = {}
            data.total = total
            data.rows = rows 
            res.json(data)
            // console.info(data)
        }).sort({ "pdf": pdforder}).skip(row * page).limit(row)
    })
     }
     if(ordername=='issms'){
        let issmsorder=(order=='asc')?1:-1
        Liver.countDocuments({}, (err, total) => {
        Liver.find(sql, {sampleid:1,pdf:1,tel:1,mval:1,chance:1,date:1,recdate:1,status:1,issms:1},(err, rows ) => {
            if (err) console.info(err)

            let data = {}
            data.total = total
            data.rows = rows 
            res.json(data)
            // console.info(data)
        }).sort({ "issms": issmsorder}).skip(row * page).limit(row)
    })
     }
        
    }else{
        Liver.countDocuments(sql, (err, total) => {
            Liver.find(sql, {sampleid:1,pdf:1,tel:1,mval:1,chance:1,date:1,recdate:1,status:1,issms:1},(err, rows) => {
                if (err) console.info(err)
    
                let data = {}
                data.total = total
                data.rows = rows 
                res.json(data)
                // console.info(data)
               
            }).sort({ "_id": -1 }).skip(row * page).limit(row)
        })
    }
})


//宫颈癌后台报告页面通过barcode,概率范围，M值范围查询
app.post("/admin/hpv/report/search", (req, res) => {
    let index = parseInt(req.body.current) - 1

    let sql = {}
    if (req.body.sampleid) {
        let sampleidbox = []
        req.body.sampleid.split("\n").forEach((element) => {
            if (element != "") {
                sampleidbox.push(new RegExp([element], 'i'))
            }
        })
        if (sampleidbox.length > 0) {
            sql.sampleid = {}
            sql.sampleid.$in = sampleidbox
        }
    }
    if (req.body.status) {
        sql.status = req.body.status
    }
    if (req.body.mlval) {
        if (!sql.hasOwnProperty("mval")) {
            sql.mval = {}
        }
        sql.mval.$gte = parseFloat(req.body.mlval)
    }
    if (req.body.mrval) {
        if (!sql.hasOwnProperty("mval")) { sql.mval = {} }
        sql.mval.$lte = parseFloat(req.body.mrval)
    }
    if (req.body.clval) {
        if (!sql.hasOwnProperty("chance")) { sql.chance = {} }
        sql.chance.$gte = parseFloat(req.body.clval)
    }
    if (req.body.crval) {
        if (!sql.hasOwnProperty("chance")) { sql.chance = {} }
        sql.chance.$lte = parseFloat(req.body.crval)
    }
    console.info(sql)

    Hpv.find(sql, (err, livers) => {
            if (err) console.info(err)
            res.send(livers)
        }).sort({ "_id": -1 }).skip(50 * index).limit(50)
})

app.post("/admin/liveruser/search", (req, res) => {
    let page = parseInt(req.body.page)-1;//page当前页
    let row = parseInt(req.body.rows);//页面最多几条
    let sql = {}
    console.info(req.body)
    if (req.body.tel) {
        if (!sql.hasOwnProperty("tel")) {sql.tel = {} }
        sql.tel.$regex = new RegExp(req.body.tel)
    }
    if (req.body.sampleid) {
        if (!sql.hasOwnProperty("sampleid")) {sql.sampleid = {} }
        sql.sampleid.$regex = new RegExp(req.body.sampleid)
    }
    if (req.body.username) {
        if (!sql.hasOwnProperty("username")) {sql.username = {} }
        sql.username.$regex = new RegExp(req.body.username)
    }
    if (req.body.datemin) {
        if (!sql.hasOwnProperty("created")) {
            sql.created = {}
        }
        sql.created.$gte = req.body.datemin
    }
    if (req.body.datemax) {
        if (!sql.hasOwnProperty("created")) { sql.created = {} }
        sql.created.$lte = req.body.datemax
    }
    console.info(sql)
    Liveruser.countDocuments(sql, (err, total) => {
        Liveruser.find(sql, (err, rows) => {
            if (err) console.info(err)
            let data = {}
            data.total = total
            data.rows = rows 
            res.json(data)
            
        }).sort({ "_id": -1 }).skip(row * page).limit(row)
    })
  
})
//泛癌用户页面
app.post("/admin/genericuser/search", (req, res) => {
    let page = parseInt(req.body.page)-1;//page当前页
    let row = parseInt(req.body.rows);//页面最多几条
    let sql = {}
    console.info(req.body)
    if (req.body.tel) {
        if (!sql.hasOwnProperty("tel")) {sql.tel = {} }
        sql.tel.$regex = new RegExp(req.body.tel)
    }
    if (req.body.sampleid) {
        if (!sql.hasOwnProperty("sampleid")) {sql.sampleid = {} }
        sql.sampleid.$regex = new RegExp(req.body.sampleid)
    }
    if (req.body.username) {
        if (!sql.hasOwnProperty("username")) {sql.username = {} }
        sql.username.$regex = new RegExp(req.body.username)
    }
    if (req.body.datemin) {
        if (!sql.hasOwnProperty("created")) {
            sql.created = {}
        }
        sql.created.$gte = req.body.datemin
    }
    if (req.body.datemax) {
        if (!sql.hasOwnProperty("created")) { sql.created = {} }
        sql.created.$lte = req.body.datemax
    }
    console.info(sql)
    Genericuser.countDocuments(sql, (err, total) => {
        Genericuser.find(sql, (err, rows) => {
            if (err) console.info(err)
            let data = {}
            data.total = total
            data.rows = rows 
            res.json(data)
            
        }).sort({ "_id": -1 }).skip(row * page).limit(row)
    })
  
})
app.post("/admin/epiageuser/search", (req, res) => {
    let page = parseInt(req.body.page)-1;//page当前页
    let row = parseInt(req.body.rows);//页面最多几条
    let sql = {}
    if (req.body.tel) {
        if (!sql.hasOwnProperty("tel")) {sql.tel = {} }
        sql.tel.$regex = new RegExp(req.body.tel)
    }
    if (req.body.sampleid) {
        if (!sql.hasOwnProperty("sampleid")) {sql.sampleid = {} }
        sql.sampleid.$regex = new RegExp(req.body.sampleid)
    }
    if (req.body.username) {
        if (!sql.hasOwnProperty("username")) {sql.username = {} }
        sql.username.$regex = new RegExp(req.body.username)
    }
    if (req.body.datemin) {
        if (!sql.hasOwnProperty("created")) {
            sql.created = {}
        }
        sql.created.$gte = req.body.datemin
    }
    if (req.body.datemax) {
        if (!sql.hasOwnProperty("created")) { sql.created = {} }
        sql.created.$lte = req.body.datemax
    }
    Epiageuser.countDocuments(sql, (err, total) => {
        Epiageuser.find(sql, (err, rows) => {
            if (err) console.info(err)

            let data = {}
                data.total = total
                data.rows = rows 
                res.json(data)
            
        }).sort({ "_id": -1 }).skip(row * page).limit(row)
    })
  
})

app.get('/client/video/dnasample', (req, res) => {

    let path = 'D:\\dnasample.mp4'
    let stat = fs.statSync(path)
    let fileSize = stat.size
    let range = req.headers.range
    if (range) {
        let parts = range.replace(/bytes=/, "").split("-")
        let start = parseInt(parts[0], 10)
        let end = parts[1] ?
            parseInt(parts[1], 10) :
            fileSize - 1
        let chunksize = (end - start) + 1
        let file = fs.createReadStream(path, { start, end })
        let head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'video/mp4',
        }
        res.writeHead(206, head);
        file.pipe(res);
    } else {
        let head = {
            'Content-Length': fileSize,
            'Content-Type': 'video/mp4',
        }
        res.writeHead(200, head)
        fs.createReadStream(path).pipe(res)
    }

})

app.get('/epihpvpdf', (req, res) => res.render('back/epihpvpdf'))

app.get("/admin/epiage/users", (req, res) => {
    Epiageuser.countDocuments({}, (err, count) => {
        //查询Epiage数据库数据,显示所有barcode
        Epiageuser.find({}, function(err, Epiageusers) {
            if (err) console.info(err)
            res.render('back/member-list-epiageusers', { "data": Epiageusers ? Epiageusers : [], "count": count }) //把数据传递给客户端页面
        }).sort({ "_id": -1 }).skip(0).limit(50)
    })
})
//肝癌客户端点击“注册查询”先去数据库查看以前是否有输入过
app.post("/client/liver/finduser", (req, res) => {
    console.info(req.body.tel)
     Liveruser.findOne({ 'sampleid': req.body.sampleid, 'tel': req.body.tel }, function(e, data) {
         if (e) console.info(e)
         res.send(data)
     })
 })
//生物学年龄客户端再次点击“注册查询”
app.post("/client/epiage/finduser", (req, res) => {
   console.info(req.body.tel)
    Epiageuser.findOne({ 'sampleid': req.body.sampleid, 'tel': req.body.tel }, function(e, data) {
        if (e) console.info(e)
        res.send(data)
    })
})
//泛癌客户端保存用户信息并查询报告状态
app.post("/client/generic/ckstatus", (req, res) => {
    console.info(req.body)
    GenericLib.findOne({ sampleid: req.body.sampleid }, function(err, genericlib) {
        if (err) console.info(err)
            //库存不存在
        if (!genericlib) {
            // res.json({"status":"empty"})
            //报告页面查询
            Generic.findOne({ sampleid: req.body.sampleid, tel: req.body.phone }, { pdf: 1, sampleid: 1, tel: 1, status: 1 }, function(e, generic) {
                if (e) console.info(e)
                res.send(generic)
            })
        } else {

            (async()  =>  {
                let data = {}
                data.sampleid = req.body.sampleid
                data.tel = req.body.phone
                data.mval = 0
                data.chance = 0
                data.date = new Date().toLocaleDateString()
                data.status = "NO_STATUS"
                data.reportPage = await fs.promises.readFile(__dirname + '/views/back/pdfhtml/genericreport.html', 'utf-8')
                GenericLib.deleteOne({ sampleid: req.body.sampleid }, function(e) {
                    if (e) console.info(e)
                    new Generic(data).save((e, generic) => {
                        if (e) { console.info(e) }
                        console.info("-------")
                        res.send(generic)
                    })
                })
            })()
        }
    })
})
//泛癌客户端保存用户信息跳转到状态查询页面时onload查询报告状态
app.post("/client/generic/ckstatus", (req, res) => {
    console.info(req.body)
    GenericLib.findOne({ sampleid: req.body.sampleid }, function(err, genericlib) {
        if (err) console.info(err)
            //库存不存在
        if (!genericlib) {
            // res.json({"status":"empty"})
            //报告页面查询
            Generic.findOne({ sampleid: req.body.sampleid, tel: req.body.phone }, { pdf: 1, sampleid: 1, tel: 1, status: 1 }, function(e, generic) {
                if (e) console.info(e)
                res.send(generic)
            })
        } else {

            (async()  =>  {
                let data = {}
                data.sampleid = req.body.sampleid
                data.tel = req.body.phone
                data.mval = 0
                data.chance = 0
                data.date = new Date().toLocaleDateString()
                data.status = "NO_STATUS"
                data.reportPage = await fs.promises.readFile(__dirname + '/views/back/pdfhtml/genericreport.html', 'utf-8')
                GenericLib.deleteOne({ sampleid: req.body.sampleid }, function(e) {
                    if (e) console.info(e)
                    new Generic(data).save((e, generic) => {
                        if (e) { console.info(e) }
                        console.info("-------")
                        res.send(generic)
                    })
                })
            })()
        }
    })
})
//肝癌客户端保存用户信息跳转到状态查询页面时onload查询报告状态
app.post("/client/liver/ckstatus", (req, res) => {
    console.info(req.body)
    LiverLib.findOne({ sampleid: req.body.sampleid }, function(err, liverlib) {
        if (err) console.info(err)
            //库存不存在
        if (!liverlib) {
            // res.json({"status":"empty"})
            //报告页面查询
            Liver.findOne({ sampleid: req.body.sampleid, tel: req.body.phone }, { pdf: 1, sampleid: 1, tel: 1, status: 1 }, function(e, liver) {
                if (e) console.info(e)
                res.send(liver)
            })
        } else {

            (async()  =>  {
                let data = {}
                data.sampleid = req.body.sampleid
                data.tel = req.body.phone
                data.mval = 0
                data.chance = 0
                data.date = new Date().toLocaleDateString()
                data.status = "NO_STATUS"
                data.reportPage = await fs.promises.readFile(__dirname + '/views/back/pdfhtml/liverreport.html', 'utf-8')
                LiverLib.deleteOne({ sampleid: req.body.sampleid }, function(e) {
                    if (e) console.info(e)
                    new Liver(data).save((e, liver) => {
                        if (e) { console.info(e) }
                        console.info("-------")
                        res.send(liver)
                    })
                })
            })()
        }
    })
})
    //生物学年龄客户端上传/注册条码
    app.post("/client/epiage/ckstatus", (req, res) => {
        console.info("999999999999999999999")
        console.info(req.body)
        EpiageLib.findOne({ barcode: req.body.barcode }, function(err, epiagelib) {
            console.info(epiagelib)
            if (err) console.info(err)
                //库存不存在
            if (!epiagelib) {
                // res.json({"status":"empty"})
                //报告页面查询
                Epiage.findOne({tel:req.body.tel ,sampleid: req.body.barcode}, { pdf: 1, sampleid: 1, tel: 1, status: 1 }, function(e, epiage) {
                    if (e) console.info(e)
                    res.send(epiage)
                })
            } else {
                (async()  =>  {
                    let data = {}
                    data.sampleid = req.body.barcode
                    data.username=req.body.username
                    data.tel = req.body.tel
                    data.chroage = 0
                    data.epiage = 0
                    data.accuracy = 0
                    data.date = new Date().toLocaleDateString()
                    data.status = "NO_STATUS"
                    data.reportPage = await fs.promises.readFile(__dirname + '/views/back/pdfhtml/epiagereport.html', 'utf-8')
                    EpiageLib.deleteOne({ barcode: req.body.barcode }, function(e) {
                        if (e) console.info(e)
                        new Epiage(data).save((e, epiage) => {
                            if (e) { console.info(e) }
                            res.send(epiage)
                        })
                    })
                })()
            }
        })
    })
//泛癌报告页面查看用户信息详情
app.get('/admin/generic/userdetail', (req, res) => {
    let data = {}
    data.sampleid = req.query.sampleid
    Genericuser.findOne(data, function(err, Genericuser) {
        res.render('back/generic-user-detail', { "Genericuser": Genericuser }) //把数据传递给客户端页面
    })
})
//肝癌报告页面查看用户信息详情
app.get('/admin/liver/userdetail', (req, res) => {
    let data = {}
    data.sampleid = req.query.sampleid
    Liveruser.findOne(data, function(err, Liveruser) {
        res.render('back/liver-user-detail', { "Liveruser": Liveruser }) //把数据传递给客户端页面
    })
})
//生物学年龄报告页面查看用户信息详情
app.get('/admin/epiage/userdetail', (req, res) => {
    let data = {}
    data.sampleid = req.query.sampleid
    Epiageuser.findOne(data, function(err, Epiageuser) {
        res.render('back/epiage-user-detail', { "Epiageuser": Epiageuser }) //把数据传递给客户端页面
    })

})
//宫颈癌报告页面查看用户信息详情
app.get('/admin/hpv/userdetail', (req, res) => {
    let data = {}
    data.sampleid = req.query.sampleid
    Hpvuser.findOne(data, function(err, Hpvuser) {
        res.render('back/hpvuserdetail', { "Hpvuser": Hpvuser }) //把数据传递给客户端页面
    })

})
//泛癌左边栏点击“用户信息”
app.get("/admin/generic/users", (req, res) => {
    //查询Epiage数据库数据,显示所有barcode
    Genericuser.countDocuments({}, (err, count) => {
        Genericuser.find({}, function(err, genericuser) {
            res.render('back/member-list-genericusers', { "data": genericuser, "count": count }) //把数据传递给客户端页面
        }).sort({ "_id": -1 }).skip(0).limit(50)
    })
})
//肝癌左边栏点击“用户信息”
app.get("/admin/liver/users", (req, res) => {
    //查询Epiage数据库数据,显示所有barcode
    Liveruser.countDocuments({}, (err, count) => {
        Liveruser.find({}, function(err, liveruser) {
            res.render('back/member-list-liverusers', { "data": liveruser, "count": count }) //把数据传递给客户端页面
        }).sort({ "_id": -1 }).skip(0).limit(50)
    })
})

app.get("/admin/hpv/users", (req, res) => {
    //查询Epiage数据库数据,显示所有barcode
    Hpvuser.countDocuments({}, (err, count) => {
        Hpvuser.find({}, function(err, hpvuser) {
            res.render('back/member-list-hpvusers', { "data": hpvuser, "count": count }) //把数据传递给客户端页面
        }).sort({ "_id": -1 }).skip(0).limit(50)
    })
})

app.get("/admin/hpv/addbarcodeview", (req, res) => {
    res.render("back/addHpvbarcodeview")
})
//泛癌后台库存点击“添加一个条码”
app.get("/admin/generic/add/barcode/view", (req, res) => { 
    (async() => {
        while(true){
            let s = [];
            for (let i = 0; i < 5; i++) {s[i] = "0123456789ABCDEFG".substr(Math.floor(Math.random() * 0x10), 1)}
            let samplieid=String(new Date().getFullYear()).substr(2)+"PA"+s.join("")
            if(!await GenericLib.findOne({samplieid:samplieid})&&! await Generic.findOne({samplieid:samplieid})){
                res.render("back/generic-add-barcode-view",{barcode:samplieid})
                break
            }
        } 
    })()
})
//肝癌后台库存点击“添加一个条码”
app.get("/admin/liver/add/barcode/view", (req, res) => { 
    (async() => {
        while(true){
            let s = [];
            for (let i = 0; i < 5; i++) {s[i] = "0123456789ABCDEFG".substr(Math.floor(Math.random() * 0x10), 1)}
            let samplieid=String(new Date().getFullYear()).substr(2)+"LV"+s.join("")
            if(!await LiverLib.findOne({samplieid:samplieid})&&! await Liver.findOne({samplieid:samplieid})){
                res.render("back/liver-add-barcode-view",{barcode:samplieid})
                break
            }
        } 
    })()
})
//宫颈癌后台库存点击“添加一个条码”
app.get("/admin/hpv/add/barcode/view", (req, res) => { 
    (async() => {
        while(true){
            let s = [];
            for (let i = 0; i < 5; i++) {s[i] = "0123456789ABCDEFG".substr(Math.floor(Math.random() * 0x10), 1)}
            let samplieid=String(new Date().getFullYear()).substr(2)+"LV"+s.join("")
            if(!await HpvLib.findOne({samplieid:samplieid})&&! await Hpv.findOne({samplieid:samplieid})){
                res.render("back/hpv-add-barcode-view",{barcode:samplieid})
                break
            }
        } 
    })()
})
//生物学年龄后台库存点击“添加一个条码”
app.get("/admin/epiage/add/barcode/view", (req, res) => {
    (async() => {
        while(true){
            let s = [];
            for (let i = 0; i < 5; i++) {s[i] = "0123456789ABCDEFG".substr(Math.floor(Math.random() * 0x10), 1)}
            let samplieid=String(new Date().getFullYear()).substr(2)+"AG"+s.join("")
            if(!await EpiageLib.findOne({barcode:samplieid})&&! await Epiage.findOne({samplieid:samplieid})){
                res.render("back/epiage-add-barcode-view",{barcode:samplieid})
                break
            }
        } 
    })()
})
//泛癌库存点击“批量添加barcode”展示界面
app.get("/admin/generic/add/batch/barcode/view", (req, res) => { 
    res.render("back/generic-batch-add-barcode-view")
})
//肝癌库存点击“批量添加barcode”展示界面
app.get("/admin/liver/add/batch/barcode/view", (req, res) => { 
    res.render("back/liver-batch-add-barcode-view")
})
//生物学年龄库存点击“批量添加barcode”展示界面
app.get("/admin/epiage/add/batch/barcode/view", (req, res) => { 
    res.render("back/epiage-batch-add-barcode-view")
})
//生物学年龄库存批量添加页面，点击“批量生成随机条码”
app.post("/admin/epiage/add/batch/barcode/data", async (req, res) => { 
    let box=[]
    for(let j=0;j<req.body.size;j++){
        while(true){
            let s = [];
            for (let i = 0; i < 5; i++) {s[i] = "0123456789ABCDEFG".substr(Math.floor(Math.random() * 0x10), 1)}
            let barcode=String(new Date().getFullYear()).substr(2)+"AG"+s.join("")
            if(!await EpiageLib.findOne({barcode:barcode})&&! await Epiage.findOne({samplieid:barcode})){
                box.push(barcode)
                break
            }
        } 
    }
    res.send(box)
})
//泛癌库存批量添加页面，点击“批量生成随机条码”
app.post("/admin/generic/add/batch/barcode/data", async (req, res) => { 
    let box=[]
    for(let j=0;j<req.body.size;j++){
        while(true){
            let s = [];
            for (let i = 0; i < 5; i++) {s[i] = "0123456789ABCDEFG".substr(Math.floor(Math.random() * 0x10), 1)}
            let samplieid=String(new Date().getFullYear()).substr(2)+"PA"+s.join("")
            if(!await GenericLib.findOne({samplieid:samplieid})&&! await Generic.findOne({samplieid:samplieid})){
                box.push(samplieid)
                break
            }
        } 
    }
    res.send(box)
})
//肝癌库存批量添加页面，点击“批量生成随机条码”
app.post("/admin/liver/add/batch/barcode/data", async (req, res) => { 
    let box=[]
    for(let j=0;j<req.body.size;j++){
        while(true){
            let s = [];
            for (let i = 0; i < 5; i++) {s[i] = "0123456789ABCDEFG".substr(Math.floor(Math.random() * 0x10), 1)}
            let samplieid=String(new Date().getFullYear()).substr(2)+"LV"+s.join("")
            if(!await LiverLib.findOne({samplieid:samplieid})&&! await Liver.findOne({samplieid:samplieid})){
                box.push(samplieid)
                break
            }
        } 
    }
    res.send(box)
})
//生物学年龄库存批量添加页面随机生成批量条码后，保存批量条码到库存EpiageLib
app.post("/admin/epiage/save/batch/barcode", async (req, res) => {
    console.info(req.body.barcodes)
    await EpiageLib.insertMany(req.body.barcodes)
    res.send("success")
})
//泛癌库存批量添加页面随机生成批量条码后，保存批量条码到库存GenericLib
app.post("/admin/generic/save/batch/barcode", async (req, res) => {
    console.info(req.body.barcodes)
    await GenericLib.insertMany(req.body.barcodes)
    res.send("success")
})
//肝癌库存批量添加页面随机生成批量条码后，保存批量条码到库存LiverLib
app.post("/admin/liver/save/batch/barcode", async (req, res) => {
    console.info(req.body.barcodes)
    await LiverLib.insertMany(req.body.barcodes)
    res.send("success")
})
//泛癌报告页面读取excel文件批量上传报告结果
app.post("/admin/generic/upload/batch/excel/result",(req,res)=>{
    try{
        let filename = req.files[0].path + path.parse(req.files[0].originalname).ext
        fs.rename(req.files[0].path, filename, function(err) {
            let reader = fs.createReadStream(filename); 
            // Read and disply the file data on console 
            reader.on('data', (buffer)=>{
                //if(!buffer){res.send("fail"); return;}
                let workbook = xlsx.read(buffer, { type: "buffer" })
                let sheet = workbook.Sheets[workbook.SheetNames[0]];
                let reportdata = xlsx.utils.sheet_to_json(sheet);
                (async() => {
                    for(let i=0;i<reportdata.length;i++){
                        let fmGenericuser={}
                        let fmData={}
                        fmData.sampleid=fmGenericuser.sampleid=new String(reportdata[i].Sampleid).trim()
                        fmData.username=fmGenericuser.username=new String(reportdata[i].Name).trim()
                        fmData.tel=fmGenericuser.tel=new String(reportdata[i].Tel?reportdata[i].Tel:"").trim()
                        fmData.sex=fmGenericuser.sex=new String(reportdata[i].Gender).trim()=="男"?0:1
                        fmData.age=fmGenericuser.age=new String(reportdata[i].Age?reportdata[i].Age:0).trim()
                        let fmGeneric={}
                        fmGeneric.sampleid=new String(reportdata[i].Sampleid).trim()
                        fmGeneric.tel=new String(reportdata[i].Tel?reportdata[i].Tel:"").trim()
                        fmGeneric.status="Completed"
                        fmData.mval=fmGeneric.mval=new String(reportdata[i].Mscore?reportdata[i].Mscore:"").trim().substring(0,4)
                        fmData.collectionDate=fmGeneric.date=new String(reportdata[i].CollectionDate).trim()
                        fmData.reciveDate=fmGeneric.recdate=new String(reportdata[i].ReciveDate).trim()
                        fmData.probability=fmGeneric.chance=new String(reportdata[i].Probability).trim().substring(0,4)
                        fmData.isNewData="newData"
                        //上传excel文件
                        //如果没有存在上传的数据，那就去库存查找有没有库存
                        //如果有库存，就删除库存条码，插入报告
                            //如果没有库存，就去查报告，如果报告没有数据，那么提示条码不存在，不允许插入
                        //如果报告中已经存在上传过的数据，需要比较一下年龄，性别，名字，和电话号码，如果相同则不需要插入，如果不同，弹出复查报告页面
                        let uploadDate=new Date().format("yyyy-MM-dd")
                        let dbgenericlib=await GenericLib.findOne({sampleid:fmData.sampleid})
                        if(dbgenericlib){ //有库存
                            let transaction = new Transaction(true);
                            try{
                                fmData.inventoryStatus="exist"
                                fmData.saveStatus="success"
                                fmData.sex=fmData.sex==0?"男":"女"
                                fmData.dataStatus="Success"
                                fmData.uploadDate=uploadDate
                                fmData.testStatus="Completed"
                                await transaction.insert("GenericReview", fmData);
                                await transaction.run()
                            }catch(e){
                                await transaction.rollback().catch(console.error)
                                console.info("generic barcode:"+fmData.sampleid+" report transaction rollback……")
                                fmData.inventoryStatus="exist"
                                fmData.saveStatus="fail"
                                fmData.sex=fmData.sex==0?"男":"女"
                                fmData.dataStatus="rollBack"
                                fmData.uploadDate=uploadDate
                                fmData.testStatus="NO_STATUS"
                                await new GenericReview(fmData).save() 
                            }finally{ 
                                await transaction.clean();
                            }
                        }else{ //没有库存
                            let dbgeneric=await Generic.findOne({sampleid:fmData.sampleid})
                            if(!dbgeneric){ //不存在在报告中
                                fmData.inventoryStatus="empty"
                                fmData.saveStatus="fail"
                                fmData.sex=fmData.sex==0?"男":"女"
                                fmData.dataStatus="InvaldData"
                                fmData.uploadDate=uploadDate
                                fmData.testStatus="NO_STATUS"
                                await new LiverReview(fmData).save()
                            }else {//库存没有找到,并且在报告中查找到
                                let transaction = new Transaction(true);
                                try{
                                    let dbgenericuser=await Liveruser.findOne({sampleid:fmGenericuser.sampleid},{_id:0,sampleid:1,username:1,tel:1,sex:1,age:1})
                                    if((dbgenericuser.username!=fmGenericuser.username)||(dbgenericuser.tel!=fmGenericuser.tel)||(dbgenericuser.sex!=fmGenericuser.sex)||(dbgenericuser.age!=fmGenericuser.age)){
                                        let dbData={}
                                        dbData.sampleid=dbgeneric.sampleid
                                        dbData.username=dbgenericuser.username
                                        dbData.tel=dbgenericuser.tel
                                        dbData.sex=(dbgenericuser.sex==0?"男":"女")
                                        //因小程序后台身份证填写改为不是必填项，所以有些客户未填，设置为与EXcel表的年龄一致
                                        dbgenericuser.age=dbgenericuser.age?dbgenericuser.age:fmGenericuser.age;
                                        //dbgenericuser.sex=dbgenericuser.sex?dbgenericuser.age:fmGenericuser.age;
                                        dbData.age=(dbgenericuser.age!=fmGenericuser.age)?"<span style='color:red'>"+dbgenericuser.age+"</span>":dbgenericuser.age
                                        dbData.testStatus="Completed"
                                        dbData.mval=dbgeneric.mval
                                        dbData.collectionDate=dbgeneric.date
                                        dbData.reciveDate=dbgeneric.recdate
                                        dbData.probability=dbgeneric.chance
                                        dbData.isNewData="oldData"
                                        dbData.dataStatus="DiffData"
                                        dbData.saveStatus="fail"
                                        dbData.uploadDate=uploadDate
                                        dbData.inventoryStatus="empty"
                                        fmData.inventoryStatus="empty"
                                        fmData.saveStatus="fail"
                                        fmData.dataStatus="DiffData"
                                        fmData.sex=fmData.sex==0?"男":"女"
                                        fmData.testStatus="Completed"
                                        fmData.uploadDate=uploadDate
                                        await transaction.insert("LiverReview", fmData);
                                        await transaction.insert("LiverReview", dbData);
                                        await transaction.run()
                                    }
                                }catch(e){
                                    await transaction.rollback().catch(console.error) 
                                    console.info(e)
                                    console.info("liver barcode:"+fmData.sampleid+" report transaction rollback……")
                                    fmData.inventoryStatus="empty"
                                    fmData.saveStatus="fail"
                                    fmData.sex=fmData.sex==0?"男":"女"
                                    fmData.dataStatus="rollBack"
                                    fmData.uploadDate=uploadDate
                                    fmData.testStatus="Completed"
                                    await new LiverReview(fmData).save()
                                }finally{
                                    await transaction.clean();
                                }
                            }
                        }
                    };   
                    res.send("success")
                })() 
            });
        })
    }catch(e){
        console.info(e)
    }
})
//生物学年龄报告页面读取excel文件批量上传报告结果
app.post("/admin/eipage/upload/batch/excel/result",(req,res)=>{
    try{
        let filename = req.files[0].path + path.parse(req.files[0].originalname).ext
        fs.rename(req.files[0].path, filename, function(err) {
            let reader = fs.createReadStream(filename); 
            // Read and disply the file data on console 
            reader.on('data', (buffer)=>{
                //if(!buffer){res.send("fail"); return;}
                let workbook = xlsx.read(buffer, { type: "buffer" }) 
                let sheet = workbook.Sheets[workbook.SheetNames[0]];
                let reportdata = xlsx.utils.sheet_to_json(sheet);
                (async() => {
                    for(let i=0;i<reportdata.length;i++){
                        let fmEpiageuser={}
                        let fmData={}
                        fmData.sampleid=fmEpiageuser.sampleid=new String(reportdata[i].sample).trim()
                        fmData.username=fmEpiageuser.username=new String(reportdata[i].Name).trim()
                        fmData.tel=fmEpiageuser.tel=new String(reportdata[i].Tel?reportdata[i].Tel:"").trim()
                        fmData.sex=fmEpiageuser.sex=new String(reportdata[i].Gender).trim()=="男"?0:1
                        fmData.chroage=fmEpiageuser.age=new String(reportdata[i].Age?reportdata[i].Age:0).trim()
                        fmData.collectionDate=fmEpiageuser.collectionDate=new String(reportdata[i].CollectionDate).trim()
                        let fmEpiage={}
                        fmEpiage.sampleid=new String(reportdata[i].sample).trim()
                        fmEpiage.tel=new String(reportdata[i].Tel?reportdata[i].Tel:"").trim()
                        fmEpiage.status="Completed"
                        fmData.chroage=fmEpiage.chroage=new String(reportdata[i].Age?reportdata[i].Age:"").trim().substring(0,4)
                        fmData.epiage=fmEpiage.epiage=new String(reportdata[i].EpiAge).trim()
                        fmData.accuracy=fmEpiage.accuracy=new String(reportdata[i].Techncial_accuracy).trim()
                        fmData.collectionDate=fmEpiage.date=new String(reportdata[i].CollectionDate).trim()
                        fmData.reciveDate=fmEpiage.recdate=new String(reportdata[i].ReciveDate).trim()
                        fmData.isNewData="newData"
                        //上传excel文件
                        //如果没有存在上传的数据，那就去库存查找有没有库存
                        //如果有库存，就删除库存条码，插入报告
                            //如果没有库存，就去查报告，如果报告没有数据，那么提示条码不存在，不允许插入
                        //如果报告中已经存在上传过的数据，需要比较一下年龄，性别，名字，和电话号码，如果相同则不需要插入，如果不同，弹出复查报告页面
                        let uploadDate=new Date().format("yyyy-MM-dd")
                        let dbepiagelib=await EpiageLib.findOne({sampleid:fmData.sampleid})
                        if(dbepiagelib){ //有库存
                            let transaction = new Transaction(true);
                            try{
                                fmData.inventoryStatus="exist"
                                fmData.saveStatus="success"
                                fmData.sex=fmData.sex==0?"男":"女"
                                fmData.dataStatus="Success"
                                fmData.uploadDate=uploadDate
                                fmData.testStatus="Completed"
                                await transaction.insert("EpiageReview", fmData);
                                await transaction.run()
                            }catch(e){
				                console.info(e)    
                                await transaction.rollback().catch(console.error)
                                console.info("liver barcode:"+fmData.sampleid+" report transaction rollback……")
                                fmData.inventoryStatus="exist"
                                fmData.saveStatus="fail"
                                fmData.sex=fmData.sex==0?"男":"女"
                                fmData.dataStatus="rollBack"
                                fmData.uploadDate=uploadDate
                                fmData.testStatus="NO_STATUS"
                                await new EpiageReview(fmData).save() 
                            }finally{ 
                                await transaction.clean();
                            }
                        }else{ //没有库存
                            let dbepiage=await Epiage.findOne({sampleid:fmData.sampleid})
                            if(!dbepiage){ //不存在在报告中
                                fmData.inventoryStatus="empty"
                                fmData.saveStatus="fail"
                                fmData.sex=fmData.sex==0?"男":"女"
                                fmData.dataStatus="InvaldData"
                                fmData.uploadDate=uploadDate
                                fmData.testStatus="NO_STATUS"
                                await new EpiageReview(fmData).save()
                            }else {//库存没有找到,并且在报告中查找到
                                let transaction = new Transaction(true);
                                try{
                                    let dbepiageuser=await Epiageuser.findOne({sampleid:fmEpiage.sampleid},{_id:0,sampleid:1,username:1,tel:1,sex:1,age:1,created:1})
                                    if((dbepiageuser.username!=fmEpiageuser.username)||(dbepiageuser.tel!=fmEpiageuser.tel)||(dbepiageuser.sex!=fmEpiageuser.sex)||(dbepiageuser.created!=fmEpiageuser.collectionDate)){
                                        let dbData={}
                                        dbData.sampleid=dbepiage.sampleid
                                        dbData.username=dbepiageuser.username
                                        dbData.tel=dbepiageuser.tel
                                        dbData.sex=(dbepiageuser.sex==0?"男":"女")
                                        //因小程序后台身份证填写改为不是必填项，所以有些客户未填，设置为与EXcel表的年龄一致
                                        // dbData.age=dbepiageuser.age?dbepiageuser.age:fmEpiageuser.age;
                                        dbData.testStatus="Completed"
                                        dbData.chroage=dbepiage.chroage
                                        dbData.epiage=dbepiage.epiage
                                        dbData.accuracy=dbepiage.accuracy
                                        dbData.collectionDate=dbepiage.date
                                        dbData.reciveDate=dbepiage.recdate
                                        dbData.isNewData="oldData"
                                        dbData.dataStatus="DiffData"
                                        dbData.saveStatus="fail"
                                        dbData.uploadDate=uploadDate
                                        dbData.inventoryStatus="empty"
                                        fmData.inventoryStatus="empty"
                                        fmData.saveStatus="fail"
                                        fmData.dataStatus="DiffData"
                                        fmData.sex=fmData.sex==0?"男":"女" 
                                        fmData.testStatus="Completed"
                                        fmData.uploadDate=uploadDate
                                        await transaction.insert("EpiageReview", fmData);
                                        await transaction.insert("EpiageReview", dbData);
                                        await transaction.run()
                                    }else{
                                        let dbData={}
                                        dbData.sampleid=dbepiage.sampleid
                                        dbData.username=dbepiageuser.username
                                        dbData.tel=dbepiageuser.tel
                                        dbData.sex=(dbepiageuser.sex==0?"男":"女")
                                        dbData.chroage=fmData.chroage
                                        dbData.epiage=fmData.epiage
                                        dbData.accuracy=fmData.accuracy
                                        dbData.collectionDate=dbepiage.date
                                        dbData.reciveDate=dbepiage.recdate
                                        dbData.testStatus="Completed"
                                        dbData.isNewData="oldData"
                                        dbData.dataStatus="Updata"
                                        dbData.saveStatus="Success"
                                        dbData.inventoryStatus="empty"
                                        dbData.uploadDate=uploadDate
                                        dbData.reciveDate=fmData.reciveDate
                                        // dbData.age=dbepiageuser.age?dbepiageuser.age:fmEpiageuser.age;
                                        await transaction.insert("EpiageReview", dbData);
                                        await transaction.run()
                                    }
                                }catch(e){
                                    await transaction.rollback().catch(console.error) 
                                    console.info(e)
                                    console.info("epiage barcode:"+fmData.sampleid+" report transaction rollback……")
                                    fmData.inventoryStatus="empty"
                                    fmData.saveStatus="fail"
                                    fmData.sex=fmData.sex==0?"男":"女"
                                    fmData.dataStatus="rollBack"
                                    fmData.uploadDate=uploadDate
                                    fmData.testStatus="Completed"
                                    await new EpiageReview(fmData).save()
                                }finally{
                                    await transaction.clean();
                                }
                            }
                        }
                    };   
                    res.send("success")
                })() 
            });
        })
    }catch(e){
        console.info(e)
    }
})
//肝癌报告页面读取excel文件批量上传报告结果
app.post("/admin/liver/upload/batch/excel/result",(req,res)=>{
    try{
        let filename = req.files[0].path + path.parse(req.files[0].originalname).ext
        //因为上传到服务器没有后缀，
        let filepath=(__dirname+"\\"+filename).substring(0, (__dirname+"\\"+filename).lastIndexOf("."))
        (async() => {
            let workbook = xlsx.readFile(filepath);
            let sheet = workbook.Sheets[workbook.SheetNames[0]];
            let reportdata = xlsx.utils.sheet_to_json(sheet);
            for(let i=0;i<reportdata.length;i++){
                let fmLiveruser={}
                let fmData={}
                fmData.sampleid=fmLiveruser.sampleid=new String(reportdata[i].Sampleid).trim()
                fmData.username=fmLiveruser.username=new String(reportdata[i].Name).trim()
                fmData.tel=fmLiveruser.tel=new String(reportdata[i].Tel?reportdata[i].Tel:"").trim()
                fmData.sex=fmLiveruser.sex=new String(reportdata[i].Gender).trim()=="男"?0:1
                fmData.age=fmLiveruser.age=new String(reportdata[i].Age?reportdata[i].Age:0).trim()
                fmData.collectionDate=fmLiveruser.collectionDate=new String(reportdata[i].CollectionDate).trim()
                let fmLiver={}
                fmLiver.sampleid=new String(reportdata[i].Sampleid).trim()
                fmLiver.tel=new String(reportdata[i].Tel?reportdata[i].Tel:"").trim()
                fmLiver.status="Completed"
                fmData.mval=fmLiver.mval=new String(reportdata[i].Mscore?reportdata[i].Mscore:"").trim().substring(0,4)
                fmData.collectionDate=fmLiver.date=new String(reportdata[i].CollectionDate).trim()
                fmData.reciveDate=fmLiver.recdate=new String(reportdata[i].ReciveDate).trim()
                fmData.probability=fmLiver.chance=new String(reportdata[i].Probability).trim().substring(0,4)
                fmData.isNewData="newData"
                console.info(fmData)
                //上传excel文件
                //如果没有存在上传的数据，那就去库存查找有没有库存
                //如果有库存，就删除库存条码，插入报告
                    //如果没有库存，就去查报告，如果报告没有数据，那么提示条码不存在，不允许插入
                //如果报告中已经存在上传过的数据，需要比较一下年龄，性别，名字，和电话号码，如果相同则不需要插入，如果不同，弹出复查报告页面
                let uploadDate=new Date().format("yyyy-MM-dd")
                let dbliverlib=await LiverLib.findOne({sampleid:fmData.sampleid})
                if(dbliverlib){ //有库存
                    let transaction = new Transaction(true);
                    try{
                        fmData.inventoryStatus="exist"
                        fmData.saveStatus="success"
                        fmData.sex=fmData.sex==0?"男":"女"
                        fmData.dataStatus="Success"
                        fmData.uploadDate=uploadDate
                        fmData.testStatus="Completed"
                        await transaction.insert("LiverReview", fmData);
                        await transaction.run()
                    }catch(e){
                        console.info(e)    
                        await transaction.rollback().catch(console.error)
                        console.info("liver barcode:"+fmData.sampleid+" report transaction rollback……")
                        fmData.inventoryStatus="exist"
                        fmData.saveStatus="fail"
                        fmData.sex=fmData.sex==0?"男":"女"
                        fmData.dataStatus="rollBack"
                        fmData.uploadDate=uploadDate
                        fmData.testStatus="NO_STATUS"
                        await new LiverReview(fmData).save() 
                    }finally{ 
                        await transaction.clean();
                    }
                }else{ //没有库存
                    let dbliver=await Liver.findOne({sampleid:fmData.sampleid})
                    if(!dbliver){ //不存在在报告中
                        fmData.inventoryStatus="empty"
                        fmData.saveStatus="fail"
                        fmData.sex=fmData.sex==0?"男":"女"
                        fmData.dataStatus="InvaldData"
                        fmData.uploadDate=uploadDate
                        fmData.testStatus="NO_STATUS"
                        await new LiverReview(fmData).save()
                    }else {//库存没有找到,并且在报告中查找到
                        let transaction = new Transaction(true);
                        try{
                            let dbliveruser=await Liveruser.findOne({sampleid:fmLiveruser.sampleid},{_id:0,sampleid:1,username:1,tel:1,sex:1,age:1,created:1})
                            // console.info(dbliveruser+"****")
                            // console.info(fmLiveruser.collectionDate+"######")
                            if((dbliveruser.username!=fmLiveruser.username)||(dbliveruser.tel!=fmLiveruser.tel)||(dbliveruser.sex!=fmLiveruser.sex)||(dbliveruser.created!=fmLiveruser.collectionDate)){
                                let dbData={}
                                dbData.sampleid=dbliver.sampleid
                                dbData.username=dbliveruser.username
                                dbData.tel=dbliveruser.tel
                                dbData.sex=(dbliveruser.sex==0?"男":"女")
                                //因小程序后台身份证填写改为不是必填项，所以有些客户未填，设置为与EXcel表的年龄一致
                                // dbliveruser.age=dbliveruser.age?dbliveruser.age:fmLiveruser.age;
                                //dbliveruser.sex=dbliveruser.sex?dbliveruser.age:fmLiveruser.age;
                                dbData.age=dbliveruser.age?dbliveruser.age:fmLiveruser.age;
                                dbData.testStatus="Completed"
                                dbData.mval=dbliver.mval
                                dbData.collectionDate=dbliver.date
                                dbData.reciveDate=dbliver.recdate
                                dbData.probability=dbliver.chance
                                dbData.isNewData="oldData"
                                dbData.dataStatus="DiffData"
                                dbData.saveStatus="fail"
                                dbData.uploadDate=uploadDate
                                dbData.inventoryStatus="empty"
                                fmData.inventoryStatus="empty"
                                fmData.saveStatus="fail"
                                fmData.dataStatus="DiffData"
                                fmData.sex=fmData.sex==0?"男":"女" 
                                fmData.testStatus="Completed"
                                fmData.uploadDate=uploadDate
                                await transaction.insert("LiverReview", fmData);
                                await transaction.insert("LiverReview", dbData);
                                await transaction.run()
                            }else{
                                let dbData={}
                                dbData.sampleid=dbliver.sampleid
                                dbData.age=dbliveruser.age?dbliveruser.age:fmLiveruser.age;
                                dbData.username=dbliveruser.username
                                dbData.tel=dbliveruser.tel
                                dbData.sex=(dbliveruser.sex==0?"男":"女")
                                dbData.mval=fmData.mval
                                dbData.probability=fmData.probability
                                dbData.collectionDate=dbliver.date
                                dbData.reciveDate=dbliver.recdate
                                dbData.testStatus="Completed"
                                dbData.isNewData="oldData"
                                dbData.dataStatus="Updata"
                                dbData.saveStatus="Success"
                                dbData.inventoryStatus="empty"
                                dbData.uploadDate=uploadDate
                                dbData.reciveDate=fmData.reciveDate
                                dbData.age=dbliveruser.age?dbliveruser.age:fmLiveruser.age;
                                await transaction.insert("LiverReview", dbData);
                                await transaction.run()
                            }
                        }catch(e){
                            await transaction.rollback().catch(console.error) 
                            console.info(e)
                            console.info("liver barcode:"+fmData.sampleid+" report transaction rollback……")
                            fmData.inventoryStatus="empty"
                            fmData.saveStatus="fail"
                            fmData.sex=fmData.sex==0?"男":"女"
                            fmData.dataStatus="rollBack"
                            fmData.uploadDate=uploadDate
                            fmData.testStatus="Completed"
                            await new LiverReview(fmData).save()
                        }finally{
                            await transaction.clean();
                        }
                    }
                }
            };   
            res.send("success")
        })()
    }catch(e){
        console.info(e)
    }
})
//肝癌报告页面读取excel文件批量上传报告结果
app.post("/admin/hpv/upload/batch/excel/result",(req,res)=>{
    try{
        let filename = req.files[0].path + path.parse(req.files[0].originalname).ext
        fs.rename(req.files[0].path, filename, function(err) {
            let reader = fs.createReadStream(filename); 
            // Read and disply the file data on console 
            reader.on('data', (buffer)=>{
                //if(!buffer){res.send("fail"); return;}
                let workbook = xlsx.read(buffer, { type: "buffer" })
                let sheet = workbook.Sheets[workbook.SheetNames[0]];
                let reportdata = xlsx.utils.sheet_to_json(sheet);
                (async() => {
                    for(let i=0;i<reportdata.length;i++){
                        let fmHpvuser={}
                        let fmData={}
                        fmData.sampleid=fmHpvuser.sampleid=new String(reportdata[i].Sampleid).trim()
                        fmData.username=fmHpvuser.username=new String(reportdata[i].Name).trim()
                        fmData.tel=fmHpvuser.tel=new String(reportdata[i].Tel?reportdata[i].Tel:"").trim()
                        fmData.sex=fmHpvuser.sex=new String(reportdata[i].Gender).trim()=="男"?0:1
                        fmData.age=fmHpvuser.age=new String(reportdata[i].Age?reportdata[i].Age:0).trim()
                        let fmHpv={}
                        fmHpv.sampleid=new String(reportdata[i].Sampleid).trim()
                        fmHpv.tel=new String(reportdata[i].Tel?reportdata[i].Tel:"").trim()
                        fmHpv.status="Completed"
                        fmData.mval=fmHpv.mval=new String(reportdata[i].Mscore?reportdata[i].Mscore:"").trim().substring(0,4)
                        fmData.collectionDate=fmHpv.date=new String(reportdata[i].CollectionDate).trim()
                        fmData.reciveDate=fmHpv.recdate=new String(reportdata[i].ReciveDate).trim()
                        fmData.probability=fmHpv.chance=new String(reportdata[i].Probability).trim().substring(0,4)
                        fmData.isNewData="newData"
                        //上传excel文件
                        //如果没有存在上传的数据，那就去库存查找有没有库存
                        //如果有库存，就删除库存条码，插入报告
                            //如果没有库存，就去查报告，如果报告没有数据，那么提示条码不存在，不允许插入
                        //如果报告中已经存在上传过的数据，需要比较一下年龄，性别，名字，和电话号码，如果相同则不需要插入，如果不同，弹出复查报告页面
                        let uploadDate=new Date().format("yyyy-MM-dd")
                        let dbhpvlib=await HpvLib.findOne({sampleid:fmData.sampleid})
                        if(dbhpvlib){ //有库存
                            let transaction = new Transaction(true);
                            try{
                                fmData.inventoryStatus="exist"
                                fmData.saveStatus="success"
                                fmData.sex=fmData.sex==0?"男":"女"
                                fmData.dataStatus="Success"
                                fmData.uploadDate=uploadDate
                                fmData.testStatus="Completed"
                                await transaction.insert("HpvReview", fmData);
                                await transaction.run()
                            }catch(e){
				                console.info(e)    
                                await transaction.rollback().catch(console.error)
                                console.info("hpv barcode:"+fmData.sampleid+" report transaction rollback……")
                                fmData.inventoryStatus="exist"
                                fmData.saveStatus="fail"
                                fmData.sex=fmData.sex==0?"男":"女"
                                fmData.dataStatus="rollBack"
                                fmData.uploadDate=uploadDate
                                fmData.testStatus="NO_STATUS"
                                await new HpvReview(fmData).save() 
                            }finally{ 
                                await transaction.clean();
                            }
                        }else{ //没有库存
                            let dbhpv=await Hpv.findOne({sampleid:fmData.sampleid})
                            if(!dbhpv){ //不存在在报告中
                                fmData.inventoryStatus="empty"
                                fmData.saveStatus="fail"
                                fmData.sex=fmData.sex==0?"男":"女"
                                fmData.dataStatus="InvaldData"
                                fmData.uploadDate=uploadDate
                                fmData.testStatus="NO_STATUS"
                                await new HpvReview(fmData).save()
                            }else {//库存没有找到,并且在报告中查找到
                                let transaction = new Transaction(true);
                                try{
                                    let dbhpvuser=await Hpvuser.findOne({sampleid:fmHpvuser.sampleid},{_id:0,sampleid:1,username:1,tel:1,sex:1,age:1})
                                    if((dbhpvuser.username!=fmHpvuser.username)||(dbhpvuser.tel!=fmHpvuser.tel)||(dbhpvuser.sex!=fmHpvuser.sex)){
                                        let dbData={}
                                        dbData.sampleid=dbhpv.sampleid
                                        dbData.username=dbhpvuser.username
                                        dbData.tel=dbhpvuser.tel
                                        dbData.sex=(dbhpvuser.sex==0?"男":"女")
                                        //因小程序后台身份证填写改为不是必填项，所以有些客户未填，设置为与EXcel表的年龄一致
                                        dbhpvuser.age=dbhpvuser.age?dbhpvuser.age:fmHpvuser.age;
                                        //dbhpvuser.sex=dbhpvuser.sex?dbhpvuser.age:fmHpvuser.age;
                                        dbData.testStatus="Completed"
                                        dbData.mval=dbhpv.mval
                                        dbData.collectionDate=dbhpv.date
                                        dbData.reciveDate=dbhpv.recdate
                                        dbData.probability=dbhpv.chance
                                        dbData.isNewData="oldData"
                                        dbData.dataStatus="DiffData"
                                        dbData.saveStatus="fail"
                                        dbData.uploadDate=uploadDate
                                        dbData.inventoryStatus="empty"
                                        fmData.inventoryStatus="empty"
                                        fmData.saveStatus="fail"
                                        fmData.dataStatus="DiffData"
                                        fmData.sex=fmData.sex==0?"男":"女" 
                                        fmData.testStatus="Completed"
                                        fmData.uploadDate=uploadDate
                                        await transaction.insert("HpvReview", fmData);
                                        await transaction.insert("HpvReview", dbData);
                                        await transaction.run()
                                    }else{
                                        let dbData={}
                                        dbData.sampleid=dbhpv.sampleid
                                        dbData.username=dbhpvuser.username
                                        dbData.tel=dbhpvuser.tel
                                        dbData.sex=(dbhpvuser.sex==0?"男":"女")
                                        dbData.mval=fmData.mval
                                        dbData.probability=fmData.probability
                                        dbData.collectionDate=dbhpv.date
                                        dbData.reciveDate=dbhpv.recdate
                                        dbData.testStatus="Completed"
                                        dbData.isNewData="oldData"
                                        dbData.dataStatus="Updata"
                                        dbData.saveStatus="Success"
                                        dbData.inventoryStatus="empty"
                                        dbData.uploadDate=uploadDate
                                        await transaction.insert("HpvReview", dbData);
                                        await transaction.run()
                                    }
                                }catch(e){
                                    await transaction.rollback().catch(console.error) 
                                    console.info(e)
                                    console.info("liver barcode:"+fmData.sampleid+" report transaction rollback……")
                                    fmData.inventoryStatus="empty"
                                    fmData.saveStatus="fail"
                                    fmData.sex=fmData.sex==0?"男":"女"
                                    fmData.dataStatus="rollBack"
                                    fmData.uploadDate=uploadDate
                                    fmData.testStatus="Completed"
                                    await new HpvReview(fmData).save()
                                }finally{
                                    await transaction.clean();
                                }
                            }
                        }
                    };   
                    res.send("success")
                })() 
            });
        })
    }catch(e){
        console.info(e)
    }
})
//肝癌前端页面加载进用户表页面时onload方法查找用户用户信息
app.post("/client/generic/finduser", (req, res) => {
    //{ sampleid: 'zzz', tel: '17329920456' }
    Genericuser.findOne({ sampleid: req.body.sampleid, tel: req.body.tel }, function(e, data) {
        if (e) console.info(e)
        res.send(data)
    })
})
//泛癌客户端用户填写个人信息页面后，点击“查询报告”
app.post("/client/generic/saveuser", (req, res) => {
    Genericuser.findOne({ sampleid: req.body.sampleid }, function(e, genericuser) {
        if (e) console.info(e)
            //如果不存在
        if (!genericuser) {
            new Genericuser(req.body).save((e,user) => {
                if (e) console.info(e)
                res.json({ "status": "success" });
            })
        } else {
            req.body.age = new Date().getFullYear() - parseInt(req.body.idCard.substr(6, 4))
            req.body.sex = 1 - (req.body.idCard.substr(req.body.idCard.length == 18 ? 16 : 14, 1) % 2)
            console.info(req.body)
            Genericuser.updateOne({ "sampleid": req.body.sampleid }, { $set:{"username":req.body.username,"tel":req.body.tel,"sex":req.body.sex,"created":req.body.created}}, function(e, status) {
                if (e) console.info(e)
                res.json({ "status": "success" });
            })
        }

    })
})
//肝癌客户端用户填写个人信息页面后，点击“查询报告”
app.post("/client/liver/saveuser", (req, res) => {
    Liveruser.findOne({ sampleid: req.body.sampleid }, function(e, liveruser) {
        if (e) console.info(e)
        if (!liveruser) {
           Liver.updateOne({sampleid:req.body.sampleid},{$set:{date:req.body.created}},function(e,data){
            if (e) console.info(e)
            Liver.findOne({sampleid:req.body.sampleid},function(e,liver){
                if (e) console.info(e)
                req.body.post=liver.post?liver.post:"未填写"
                req.body.date=liver.date
                    new Liveruser(req.body).save((e,user) => {
                        if (e) console.info(e)
                        res.json({ "status": "success" });
                    })
                
            })
        })
          
        } else {
            Liver.updateOne({"sampleid":req.body.sampleid},{$set:{date:req.body.created}},function(e,st){
                if(e) console.info(e)
                Liveruser.updateOne({ "sampleid": req.body.sampleid }, { $set:{"username":req.body.username,"tel":req.body.tel,sex:req.body.sex,"created":req.body.created}}, function(e, status) {
                    if (e) console.info(e)
                    res.json({ "status": "success" });
                })
            })
         
        }

    })
})
//生物学年龄客户端用户填写个人信息页面后，点击“查询报告”
app.post("/client/epiage/saveuser", (req, res) => {
    Epiageuser.findOne({ sampleid: req.body.sampleid }, function(e, epiageuser) {
        if (e) console.info(e)
            //如果不存在
        if (!epiageuser) {
            Epiage.updateOne({sampleid:req.body.sampleid},{$set:{date:req.body.created}},function(e,data){
                if (e) console.info(e)
                Epiage.findOne({sampleid:req.body.sampleid},function(e,epiage){
                    if (e) console.info(e)
                    req.body.post=epiage.post?epiage.post:"未填写"
                    req.body.date=epiage.date
                    new Epiageuser(req.body).save((e,user) => {
                        if (e) console.info(e)
                        res.json({ "status": "success" });
                    })
                    
                })
            })
        } else {
            Epiageuser.updateOne({ "sampleid": req.body.sampleid }, { $set:req.body}, function(e,st) {
                if (e) console.info(e)
                res.json({ "status": "success" });
            })
            Epiage.updateOne({"sampleid":req.body.sampleid},{$set:{date:req.body.created}},function(){
                if(e) console.info(e)
                Epiageuser.updateOne({ "sampleid": req.body.sampleid }, { $set:{"username":req.body.username,"tel":req.body.tel,"created":req.body.created}}, function(e, status) {
                    if (e) console.info(e)
                    res.json({ "status": "success" });
                })
            })
        }

    })
})
app.post("/client/hpv/barcodes", (req, res) => {
    Hpvuser.findOne(req.body,(err,hpvuser)=>{
        if(err) console.info(err)
        else if(!hpvuser) return []
        else{
	   if(!liveruser) { return []}
            let parm={}
            parm.tel=hpvuser.tel
            Hpv.find(parm, { sampleid: 1, status: 1 }, function(err, hpv) {
                if (err) console.info(err)
                else {
                    console.info(hpv)
                    res.send(hpv)
                }

            })
        }

    })
})
//泛癌客户端点击注册查询按钮
app.post("/client/generic/barcodes", (req, res) => {
    console.info(req.body.tel)
        Generic.find(req.body, { sampleid: 1, status: 1 }, function(err, generic) {
            if (err) console.info(err)
            res.send(generic)
        })
    })
//肝癌客户端点击注册查询按钮
app.post("/client/liver/barcodes", (req, res) => {
    console.info(req.body.tel)
        Liver.find(req.body, { sampleid: 1, status: 1 }, function(err, liver) {
            if (err) console.info(err)
            res.send(liver)
        })
    })
  //泛癌客户端传过来上传或注册barcode
  app.post("/client/generic/uploadbarcode", (req, res) => {
    GenericLib.findOne({ sampleid: req.body.sampleid }, function(err, result) {
        if (err) console.info(err)
            //如果库存不存在
        if (!result) {
            // res.json({"status":"empty"})
            //报告页面查询
            Generic.findOne({ sampleid: req.body.sampleid, tel: req.body.tel }, function(e, rs) {
                if (e) console.info(e)
                res.send(rs)
            })
        } else {
            (async() => {
                let data = {}
                data.tel = req.body.tel
                data.status = result.status
                data.sampleid = result.sampleid
                data.mval = 0
                data.chance = 0
                data.date = new Date().format("yyyy-MM-dd")
                data.reportPage = await fs.promises.readFile(__dirname + '/views/back/pdfhtml/genericreport.html', 'utf-8')
                GenericLib.deleteOne({ sampleid: req.body.sampleid }, function(err) {
                    if (err) console.info(err)
                    new Generic(data).save((e2, r2) => {
                        if (e2) { console.info(e2) }
                        res.json({ "status": data.status })
                    })
                })
            })()
        }
    })

})
  //肝癌客户端传过来上传或注册barcode
app.post("/client/liver/uploadbarcode", (req, res) => {
    LiverLib.findOne({ sampleid: req.body.sampleid }, function(err, result) {
        if (err) console.info(err)
            //库存不存在
        if (!result) {
            // res.json({"status":"empty"})
            //报告页面查询
            Liver.findOne({ sampleid: req.body.sampleid, tel: req.body.tel }, function(e, rs) {
                if (e) console.info(e)
                res.send(rs)
            })
        } else {
            (async() => {
                let data = {}
                data.tel = req.body.tel
                data.status = result.status
                data.sampleid = result.sampleid
                data.mval = 0
                data.chance = 0
                data.date = new Date().format("yyyy-MM-dd")
                data.post=result.post
                data.reportPage = await fs.promises.readFile(__dirname + '/views/back/pdfhtml/liverreport.html', 'utf-8')
                LiverLib.deleteOne({ sampleid: req.body.sampleid }, function(err) {
                    if (err) console.info(err)
                    new Liver(data).save((e2, r2) => {
                        if (e2) { console.info(e2) }
                        res.json({ "status": data.status })
                    })
                })
            })()
        }
    })

})
    //宫颈癌客户端传过来上传或注册barcode状态
app.post("/client/hpv/uploadbarcode", (req, res) => {
        HpvLib.findOne({ sampleid: req.body.sampleid }, function(e, data) {
            if (e) console.info(err)
                //库存不存在
            if (!data) {
                //报告页面查询
                Hpv.findOne({ sampleid: req.body.sampleid, tel: req.body.phone }, function(e, rs) {
                    if (e) console.info(e)
                    if (!rs) res.json({ "status": "fail" })
                    else res.json({ "status": "success" })
                })
            } else {
                res.json({ "status": "success" })
            }
        })
    })
//生物学年龄客户端上传/注册barcode,后台保存该barcode对应报告页面到数据库
app.post("/client/epiage/uploadbarcode", (req, res) => {
    EpiageLib.findOne({ 'barcode': req.body.barcode }, function(err, result) {
        if (err) console.info(err)
            //先去查库存不存在
        if (!result) {
            // res.json({"status":"empty"})
            //报告页面查询
            Epiage.findOne({ 'sampleid': req.body.barcode, 'tel': req.body.tel }, function(e, rs) {
                if (e) console.info(e)
                res.send(rs)
            })
        } else {
            (async() => {
                let data = {}
                data.username=""
                data.tel = req.body.tel
                data.status = result.status
                data.sampleid = result.barcode//拿到库存对应的barcode放到epiage表，再删掉库存
                data.chroage = 0
                data.epiage = 0
                data.accuracy = 0
                data.post=result.post
                data.date = new Date().format("yyyy-MM-dd")
                console.info(data)
                console.info("--------nice-----------------")
                data.reportPage = await fs.promises.readFile(__dirname + '/views/back/pdfhtml/epiagereport.html', 'utf-8')
                EpiageLib.deleteOne({ barcode: req.body.barcode }, function(err) {
                    if (err) console.info(err)
                    new Epiage(data).save((e2, r2) => {
                        if (e2) { console.info(e2) }
                        res.json({ "status": data.status })
                    })
                })
            })()
        }
    })

})
    // 文件上传接口 
app.post('/admin/liver/lib/upload/batch/barcode/txt', function(req, res) {
    // 上传的文件在req.files中
    const filename = req.files[0].path + path.parse(req.files[0].originalname).ext
    fs.rename(req.files[0].path, filename, function(err) {
        if (err) {
            res.send(err)
        } else {
            //从上传成功的文件里读取文件数据
            let stream = readline.createInterface({ input: fs.createReadStream(filename) })
            stream.on('line', (sampleid) => {
                    //把异步变同步方便处理数据
                LiverLib.findOne({ "sampleid": sampleid }, (err, liverlib) => {
                    if (err) console.info(err)
                    if (!liverlib) { //不存在
                        Liver.findOne({ "sampleid": sampleid },(err,liver)=>{
                            if(!liver){ //不存在
                                let data = {}
                                data.name = "肝癌早期筛查"
                                data.created = new Date().toLocaleDateString();
                                data.sampleid = line
                                data.status = "NO_STATUS"
                                new LiverLib(data).save((err) => {
                                    if (err) console.info(err)
                                })
                            }
                        })
                       
                    }
                }).catch(e=>{
                    console.info(e)
                })
            })
            stream.on('close', (err) => {
                if (err) console.info(err)
                res.redirect("/admin/liver/lab/barcodes")
            });

        }
    })
})
//宫颈癌检测文件批量上传barcode
app.post('/admin/hpv/uploadcvs', function(req, res) {
    // 上传的文件在req.files中
    const filename = req.files[0].path + path.parse(req.files[0].originalname).ext
    fs.rename(req.files[0].path, filename, function(err) {
        if (err) {
            res.send(err)
        } else {
            //从上传成功的文件里读取文件数据
            let stream = readline.createInterface({ input: fs.createReadStream(filename) })
            stream.on('line', (line) => {
                let data = {}
                data.name = "宫颈癌早期筛查"
                data.created = new Date().toLocaleDateString();
                data.sampleid = line
                data.status = "NO_STATUS"
                    //把异步变同步方便处理数据
                HpvLib.findOne({ "sampleid": line }, (err, rsdata) => {
                    if (err) console.info(err)
                    if (!rsdata) {
                        new HpvLib(data).save((err) => {
                            if (err) console.info(err)
                        })
                    }
                })
            })
            stream.on('close', (err) => {
                if (err) console.info(err)
                res.redirect("/admin/hpv/lab/barcodes")
            });
        }
    })
})
//泛癌库存添加单个条码页面点击保存时把要添加的条码经过去重复判断后，保存到LiverLib表展示到库存页面
app.post('/admin/generic/add/barcode', (req, res) => {
    let data = {}
    data.name = "泛癌早期筛查"
    data.created = new Date().toLocaleDateString();
    data.sampleid = req.body.barcode.trim()
    data.status = "NO_STATUS"
    data.post=req.body.post.trim()
    console.info(data)
    GenericLib.findOne({ "sampleid": data.sampleid }, function(e,genericlib) {
        if (e) console.info(e)
        if (!genericlib) {
            Generic.findOne({ "sampleid": data.sampleid },function(err,generic){
                if(!generic){
                    new GenericLib(data).save((e, results) => {
                        if (e) console.info(e)
                        res.send("success")
                    })
                }else{
                    res.send("error")
                }
            })
          
        } else {
            res.send("error")
        }
    })
})
//肝癌库存添加单个条码页面点击保存时把要添加的条码经过去重复判断后，保存到LiverLib表展示到库存页面
app.post('/admin/liver/add/barcode', (req, res) => {
    let data = {}
    data.name = "肝癌早期筛查"
    data.created = new Date().toLocaleDateString();
    data.sampleid = req.body.barcode.trim()
    data.status = "NO_STATUS"
    data.post=req.body.post.trim()
    LiverLib.findOne({ "sampleid": data.sampleid }, function(e, liverlib) {
        if (e) console.info(e)
        if (!liverlib) {
            Liver.findOne({ "sampleid": data.sampleid },function(err,liver){
                if(!liver){
                    new LiverLib(data).save((e, results) => {
                        if (e) console.info(e)
                        res.send("success")
                    })
                }else{
                    res.send("error")
                }
            })
          
        } else {
            res.send("error")
        }
    })
})
//生物学年龄库存添加一条barcode
app.post('/admin/epiage/add/barcode', (req, res) => {
    let data = {}
    data.name = "DNA Methylation Kit"
    data.createtime = new Date().toLocaleDateString();
    data.barcode = req.body.barcode.trim()
    data.status = "NO_STATUS"
    data.post=req.body.post.trim()
    console.info(data)
    EpiageLib.findOne({ "barcode": data.barcode }, function(e, epiagelib) {
        if (e) console.info(e)
        if (!epiagelib) {
            Epiage.findOne({ "sampleid": data.barcode },function(err,epiage){
                if(!epiage){
                    new EpiageLib(data).save((e, results) => {
                        if (e) console.info(e)
                        res.send("success")
                    })
                }else{
                    res.send("error")
                }
            })
          
        } else {
            res.send("error")
        }
    })


})
//宫颈癌添加单个barcode保存到数据库
app.post('/admin/hpv/savebarcode', (req, res) => {
    let data = {}
    data.name = "宫颈癌早期筛查"
    data.created = new Date().toLocaleDateString();
    data.sampleid = req.body.barcode.trim()
    data.status = "NO_STATUS"
    HpvLib.findOne({ "sampleid": data.sampleid }, function(e, result) {
        if (e) console.info(e)
        if (!result) {
            new HpvLib(data).save((e, results) => {
                if (e) console.info(e)
                res.send("success")
            })
        } else {
            res.send("error")
        }
    })
})
//泛癌库存barcode删除一条数据
app.post("/admin/generic/deletelab", (req, res) => {
    console.log("泛癌库存删除的条码id是： " + req.body.id)
    GenericLib.deleteOne({ _id: req.body.id }, function(err, data) {
        if (err) console.info(err)
        res.send("success")

    })
})
//肝癌库存barcode删除一条数据
app.post("/admin/liver/deletelab", (req, res) => {
    console.log("删除的id是： " + req.body.id)
    LiverLib.deleteOne({ _id: req.body.id }, function(err, data) {
        if (err) console.info(err)
        res.send("success")

    })
})
//宫颈癌库存barcode删除一条数据
app.post("/admin/hpv/deletelab", (req, res) => {
    console.log("删除的id是： " + req.body.id)
    HpvLib.deleteOne({ _id: req.body.id }, function(err, data) {
        if (err) console.info(err)
        res.send("success")
    })
})
app.post("/admin/liver/deleteuser", (req, res) => {
    console.log("删除的id是： " + req.body.id)
    Liveruser.deleteOne({ _id: req.body.id }, function(err, data) {
        if (err) console.info(err)
        res.send("success")

    })
})
app.post("/admin/generic/deleteuser", (req, res) => {
    console.log("删除的id是： " + req.body.id)
    Genericuser.deleteOne({ _id: req.body.id }, function(err, data) {
        if (err) console.info(err)
        res.send("success")

    })
})
//肝癌报告页面更新下拉框状态操作
app.post("/admin/generic/updatestatus", (req, res) => {
    let id = req.body.id
    let status = req.body.status
    console.info(req.body)
        //查询数据库数据
    Generic.updateOne({ "_id": id }, { $set: { status: status } }, function(err, result) {
        if (err) console.info(err)
        res.send("success")
    })
})
//肝癌报告页面更新下拉框状态操作
app.post("/admin/liver/updatestatus", (req, res) => {
    let id = req.body.id
    let status = req.body.status
    console.info(req.body)
        //查询数据库数据
    Liver.updateOne({ "_id": id }, { $set: { status: status } }, function(err, result) {
        if (err) console.info(err)
        res.send("success")
    })
})
//生物学年龄报告页面更新库存数据状态
app.post("/admin/epiage/updatestatus", (req, res) => {
    let id = req.body.id
    let status = req.body.status
    console.info(id)
    console.info(status)
        //查询数据库数据
    Epiage.updateOne({ "_id": id }, { $set: { status: status } }, function(err, result) {
        if (err) console.info(err)
        res.send("success")
    })
})
//宫颈癌报告页面更新下拉框状态操作
app.post("/admin/hpv/updatestatus", (req, res) => {
    let id = req.body.id
    let status = req.body.status
        //查询数据库数据
    Hpv.updateOne({ "_id": id }, { $set: { status: status } }, function(err, result) {
        if (err) console.info(err)
        res.send("success")
    })
})
//泛癌更新库存页面参数变化(下拉状态选择)到数据库
app.post("/admin/generic/lib/updatestatus", (req, res) => {
    let id = req.body.id
    let status = req.body.status
    console.info(id)
    console.info(status)
        //查询数据库数据
    GenericLib.updateOne({ "_id": id }, { $set: { status: status } }, function(err, result) {
        if (err) console.info(err)
        res.send("success")
    })
})
//肝癌更新库存页面参数变化(下拉状态选择)到数据库
app.post("/admin/liver/lib/updatestatus", (req, res) => {
    let id = req.body.id
    let status = req.body.status
    console.info(id)
    console.info(status)
        //查询数据库数据
    LiverLib.updateOne({ "_id": id }, { $set: { status: status } }, function(err, result) {
        if (err) console.info(err)
        res.send("success")
    })
})
//生物学年龄更新库存页面参数变化(下拉状态选择)到数据库
app.post("/admin/epiage/lib/updatestatus", (req, res) => {
    let id = req.body.id
    let status = req.body.status
    console.info(id)
    console.info(status)
        //查询数据库数据
    EpiageLib.updateOne({ "_id": id }, { $set: { status: status } }, function(err, result) {
        if (err) console.info(err)
        res.send("success")
    })
})
//宫颈癌更新库存页面参数变化(下拉状态选择)到数据库
app.post("/admin/hpv/lib/updatestatus", (req, res) => {
    let id = req.body.id
    let status = req.body.status
    console.info(id)
    console.info(status)
        //查询数据库数据
    HpvLib.updateOne({ "_id": id }, { $set: { status: status } }, function(err, result) {
        if (err) console.info(err)
        res.send("success")
    })
})
//泛癌后台点击侧边栏“条码库存”
app.get("/admin/generic/lab/barcodes", (req, res) => {
    GenericLib.countDocuments({}, (err, count) => {
        GenericLib.find({}, (err, genericlibs) => {
            console.info(genericlibs)
            if (err) console.info(err)
            res.render('back/member-list-genericlib', { "data": genericlibs, "count": count }) //把数据传递给客户端页面
        }).sort({ "_id": -1 }).skip(0).limit(50)
    })
})
//肝癌后台点击侧边栏“条码库存”
app.get("/admin/liver/lab/barcodes", (req, res) => {
    LiverLib.countDocuments({}, (err, count) => {
        LiverLib.find({}, (err, liverlibs) => {
            if (err) console.info(err)
            res.render('back/member-list-liverlib', { "data": liverlibs, "count": count }) //把数据传递给客户端页面
        }).sort({ "_id": -1 }).skip(0).limit(50)
    })

})
//宫颈癌癌后台点击侧边栏“条码库存”
app.get("/admin/hpv/lab/barcodes", (req, res) => {
    HpvLib.countDocuments({}, (err, count) => {
        HpvLib.find({}, (err, hpvlibs) => {
            if (err) console.info(err)
            res.render('back/member-list-hpvlib', { "data": hpvlibs, "count": count }) //把数据传递给客户端页面
        }).sort({ "_id": -1 }).skip(0).limit(50)
    })

})
//泛癌报告页面发送短信给客户提示去小程序根据手机号与条码查看报告
app.post('/admin/generic/client/sms', (req, res) => {
    let tel = req.body.tel
   let sampleid=req.body.sampleid
       //初始化sms_client
       // 开始发送短信
   smsClient.sendSMS({
       PhoneNumbers:tel ,
       "SignName": "百诺医学",
       "TemplateCode": "SMS_224345855",
       "TemplateParam": `{"barcode":'${sampleid}',"phone":'${tel}'}`, // 短信模板变量对应的实际值，JSON格式
   }).then(result => {
       console.log(result)
       let { Code } = result;
       (async() => {
           if (Code == 'OK') {
               await Generic.updateOne(req.body, { $set: { issms: 1 } })
               console.info("发送报告信息"+req.body.tel+" 条码--->"+req.body.sampleid+" 成功")
               res.json({status: 'success' })
           }else{
               console.info("发送报告信息"+req.body.tel+" 条码--->"+req.body.sampleid+" 失败")
               res.json({status: 'fail' })
           }
       })()
   }).catch(err => {
       if(err){
           console.log(err);
           console.info("发送报告信息--->"+req.body.phone+" 条码--->"+req.body.sampleid+" 失败")
           res.json({status: 'fail' })
       }
      
   })
})

//肝癌报告页面发送短信给客户提示去小程序根据手机号与条码查看报告
app.post('/admin/liver/client/sms', (req, res) => {
     let tel = req.body.tel
    let sampleid=req.body.sampleid
        //初始化sms_client
        // 开始发送短信
    smsClient.sendSMS({
        PhoneNumbers:tel ,
        "SignName": "百诺医学",
        "TemplateCode": "SMS_224350847",
        "TemplateParam": `{"barcode":'${sampleid}',"phone":'${tel}'}`, // 短信模板变量对应的实际值，JSON格式
    }).then(result => {
        console.log(result)
        let { Code } = result;
        (async() => {
            if (Code == 'OK') {
                await Liver.updateOne(req.body, { $set: { issms: 1 } })
                console.info("发送报告信息"+req.body.tel+" 条码--->"+req.body.sampleid+" 成功")
                res.json({status: 'success' })
            }else{
                console.info("发送报告信息"+req.body.tel+" 条码--->"+req.body.sampleid+" 失败")
                res.json({status: 'fail' })
            }
        })()
    }).catch(err => {
        if(err){
            console.log(err);
            console.info("发送报告信息--->"+req.body.phone+" 条码--->"+req.body.sampleid+" 失败")
            res.json({status: 'fail' })
        }
       
    })
})
//生物学年龄报告页面发送短信给客户提示去小程序根据手机号与条码查看报告
app.post('/admin/epiage/client/sms', (req, res) => {
    let tel = req.body.tel
   let sampleid=req.body.sampleid
       //初始化sms_client
       // 开始发送短信
   smsClient.sendSMS({
       PhoneNumbers:tel ,
       "SignName": "百诺医学",
       "TemplateCode": "SMS_227246365",
       "TemplateParam": `{"barcode":'${sampleid}',"phone":'${tel}'}`, // 短信模板变量对应的实际值，JSON格式
   }).then(result => {
       console.log(result)
       let { Code } = result;
       (async() => {
           if (Code == 'OK') {
               await Epiage.updateOne(req.body, { $set: { issms: 1 } })
               console.info("发送报告信息"+req.body.tel+" 条码--->"+req.body.sampleid+" 成功")
               res.json({status: 'success' })
           }else{
               console.info("发送报告信息"+req.body.tel+" 条码--->"+req.body.sampleid+" 失败")
               res.json({status: 'fail' })
           }
       })()
   }).catch(err => {
       if(err){
           console.log(err);
           console.info("发送报告信息--->"+req.body.phone+" 条码--->"+req.body.sampleid+" 失败")
           res.json({status: 'fail' })
       }
      
   })
})
//宫颈癌报告页面发送短信给客户提示去小程序根据手机号与条码查看报告
app.post('/admin/hpv/client/sms', (req, res) => {
    let tel = req.body.tel
    let sampleid=req.body.sampleid
        //初始化sms_client
        // 开始发送短信
    smsClient.sendSMS({
        PhoneNumbers:tel ,
        "SignName": "百诺医学",
        "TemplateCode": "SMS_224350847",
        "TemplateParam": `{"barcode":'${sampleid}',"phone":'${tel}'}`, // 短信模板变量对应的实际值，JSON格式
    }).then(result => {
        console.log(result)
        let { Code } = result;
        (async() => {
            if (Code == 'OK') {
                await Hpv.updateOne(req.body, { $set: { issms: 1 } })
                console.info("发送报告信息"+req.body.tel+" 条码--->"+req.body.sampleid+" 成功")
                res.json({status: 'success' })
            }else{
                console.info("nimei")
                console.info("发送报告信息"+req.body.tel+" 条码--->"+req.body.sampleid+" 失败")
                res.json({status: 'fail' })
            }
        })()
    }).catch(err => {
        if(err){
            console.log(err);
            console.info("发送报告信息--->"+req.body.phone+" 条码--->"+req.body.sampleid+" 失败")
            res.json({status: 'fail' })
        }
       
    })
})
//小程序端用户注册发送验证码
app.post('/client/user/sms', (req, res) => {
    console.info(req.query.phone)
        //let phone= req.query.phone
    let phone = req.body.phone
    let code = Math.random().toString().slice(-6)
        // 开始发送短信
    smsClient.sendSMS({
        PhoneNumbers: phone,
        "SignName": "Epidial",
        "TemplateCode": "SMS_159965409",
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

//查询mysql数据库hdreportdb的result表，再通过result表的reportid字段查询report表，获取里面对应的用户报告数据
//req.body是获取post传递过来的参数
//req.query是获取get传递过来的参数
app.post("/admin/epihpv/epihpvreport", (req, res) => {
    // console.info(req.body.barcode + "/admin/epihpv/epihpvreport")
    //select * from  report where report.barcode=?
    connection.query("select Pat_Name,Pat_Sex,Pat_AgeStr,Barcode,RptUnitID,SampleNo,SampleDate,Sampled_Dt,Sampled_Dt,Report_Comm,Report_Username,Rechk_Username,Upload_Time,HospRptItemName,Result_Str,Result_Flag from result, report where result.ReportID=report.ReportId and report.barcode=?", [req.body.barcode], (err, results, fields) => {
        if (err) {
            logger.error(err);
        } else {
            // console.info(results[0])
            res.send(results)
        }
    })
})

//宫颈癌查询报告页面，接受用户输入的值去数据库查是否有该数据，有就返回，没有就提示barcode有错
app.post("/admin/epihpv/chechpval", (req, res) => {
        console.info(req.body.barcode + "/admin/epihpv/chechpval")
        connection.query("select Barcode from  report where report.barcode=?", [req.body.barcode], (err, results, fields) => {
            if (err) {
                logger.error(err);
            } else {
                // console.info("select Barcode from  report where report.barcode=:")
                // console.info(results)
                res.send(results[0])
            }
        })
    })
    //肝癌查询报告页面，接受用户输入的值去数据库查是否有该数据，有就返回，没有就提示barcode有错
app.post("/admin/epiliver/checkliverval", (req, res) => {
        console.info("/admin/epiliver/checkliverval" + req.body.sampleid)
        Liver.findOne({ sampleid: req.body.sampleid }, function(err, result) {
            res.send(result) //把数据传递给客户端页面
        })

    })

//生物学年龄客户端一打开客户端onload方法就根据传过来的手机号去查询该手机号下面的所有barcode及状态
app.post("/client/epiage/barcodes", (req, res) => {
    console.info(req.body.tel)
    Epiage.find(req.body, { sampleid: 1, status: 1}, function(err, epiage) {
        if (err) console.info(err)
        console.info("生物学历史barcode")
        console.info(epiage)
        res.send(epiage)
    })
})


//接受小程序端登录页面传过来的用户名跟密码
app.post("/client/user/login", (req, res) => {
    console.info(req.body.phone)
    console.info(req.body.password)
    User.findOne({ "phone": req.body.phone, "password": req.body.password }, function(err, result) {
        if (err) console.info(err)
        if (!result) {
            res.json({ "status": "error" })
        } else {
            console.info(result)
            res.json({ "status": "success" })
        }
    })
})
app.post("/client/user/finduser", (req, res) => {
        console.info(req.body.phone)
        User.findOne({ "phone": req.body.phone }, function(e, data) {
            if (e) console.info(e)
            console.info(data)
            res.send(data)
        })
    })
    //接受小程序端登录页面传过来的用户名跟密码
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
    //生物学年龄查询报告页面，接受用户输入的值去数据库查是否有该数据，有就返回，没有就提示barcode有错
app.post("/admin/epiage/checkepiageval", (req, res) => {
        console.info("/admin/epiage/checkepiageval:" + req.body.sampleid)
        Epiage.findOne({ sampleid: req.body.sampleid }, function(err, result) {
            if (err) console.info(err)
            res.send(result) //把数据传递给客户端页面
        })
    })
    //用户查询报告页面
// app.post("/client/epiage/ckreport", (req, res) => {
//     console.info(req.body.tel)
//     console.info(req.body.barcode)
//     Epiage.findOne({ 'tel': req.body.tel, 'sampleid': req.body.barcode }, { status: 1, sampleid: 1, pdf: 1 }, function(err, result) {
//         if (err) console.info(err)
//             console.info(result)
//         res.send(result) //把数据传递给客户端页面
//     })
// })




//宫颈癌微信小程序页面请求数据库加载报告页面手动输入的数据
app.post("/admin/epihpv/hpvinserval", (req, res) => {
    // console.info(req.body.barcode + "/admin/epihpv/hpvinserval")
    connection.query("select samplesta,deliverdoc,deliverdoctel,barcode from epihpvrep where barcode=?", [req.body.barcode], (err, results, fields) => {
        if (err) {
            logger.error(err);
        } else {
            res.send(results)
        }
    })
})



//宫颈癌渲染result表到后台页面
app.post('/admin/epihpv/inserval', (req, res) => {
        console.info(req.body.barcode + "/admin/epihpv/inserval")
        connection.query("select HospRptItemName, Result_Str,Result_Ref, Result_Flag from result,report where report.ReportID=result.ReportID and report.Barcode=?", [req.body.barcode], (err, results, fields) => {
            if (err) {
                logger.error(err);
            } else {
                res.send(results)
            }
        })
    })
    //查询epihpvrep表渲染到后台页面
app.post('/admin/epihpv/inserinputval', (req, res) => {
        console.info(req.body.barcode + "/admin/epihpv/inserinputval")
        connection.query("select samplesta,deliverdoc,deliverdoctel from  epihpvrep where  Barcode=?", [req.body.barcode], (err, results, fields) => {
            if (err) {
                logger.error(err);
            } else {
                res.send(results[0])
            }
        })
    })
    //宫颈癌检测后台页面分页
app.post("/admin/pagenationEpiHpv", (req, res) => {

        let index = parseInt(req.body.current) - 1
        let vdata = {}
        connection.query("select * from  report,result where result.ReportID=report.ReportId and report.barcode=?", [req.query.barcode], (err, results, fields) => {
                if (err) {
                    logger.error(err);
                } else {
                    res.send(results).sort({ "_id": -1 }).skip(50 * index).limit(50)
                }
            })
            // Epiage.findOne(vdata, function (err, result) {
            //   res.send(result) //把数据传递给客户端页面
            // }).sort({ "_id": -1 }).skip(50 * index).limit(50 * index + 49)
    })
    //肝癌库存搜索
// app.post("/admin/liver/lab/search", (req, res) => {
//     let regexp = new RegExp(req.body.barcode, 'i')
//     LiverLib.find({ sampleid: { $regex: regexp } }, function(err, liverlibs) {
//         if (err) console.info(err)
//         res.send(liverlibs)
//     })
// })
app.get("/admin/liver/liverhtml", (req, res) => {
    let id = req.query.ids.split("#")[0]
    let samplieid = req.query.ids.split("#")[1]
    console.info(samplieid)
    Liver.findOne({ "_id": id }, function(err, result) {
        if (err) { console.info(err) } else if (result && result.reportPage) {
            let html = result.reportPage
            res.send(html);
        }
    })
})
//泛癌后台报告页面生成pdf报告
app.post("/admin/generic/build/generic/pdf", (req, res) => {
    let id = req.body.id //根据样本id查询到那条记录，然后根据这个ID 查询数据返回htmlpage给浏览器显示
    wkhtmltopdf.command = __dirname + "\\wkhtmltopdf.exe"
        //wkhtmltopdf('http://localhost:3000/admin/reportgeneric?id=' + id, { output: __dirname+'/public/pdffile/xx.pdf'});
    console.info("build pdf id--->"+id)
    Generic.findOne({ "_id": id }, function(err, generic) {
      
        if (err) { console.info(err) } else if (generic) { // true false 0 1 undefind=false 有值=true
            //let html = result.reportPage
            let pdfpath = __dirname + '/public/pdffile/' + generic.sampleid + '.pdf'
                //wkhtmltopdf(html.replace(/block/g, "none"), { output: spath })
                //把html变为一个文件,有了文件路径 就可以执行window-x64-phantomjs.exe命令不要担心双引号拼接字符串问题
            let phantomjs = platform.indexOf("win") != -1 ? "window-x64-phantomjs.exe" : "linux-x64-phantomjs.exe"
            console.info(__dirname + "/" + phantomjs + " " + __dirname + "/rasterize-generic.js https://bainuo.beijingepidial.com/admin/generic/report?id=" + id + " " + pdfpath)
            child.exec(__dirname + "/" + phantomjs + " " + __dirname + "/rasterize-generic.js https://bainuo.beijingepidial.com/admin/generic/report?id=" + id + " " + pdfpath, function(err, data) {
                if (err) { res.send("fail") } else {
                    Generic.updateOne({ "_id": id }, { $set: { pdf: generic.sampleid + '.pdf',status:"Completed",pdfbuildate:req.body.pdfbuildate?req.body.pdfbuildate:generic.pdfbuildate } }, function(err, status) {
                        (async() => {
                            if (err) console.info(err)
                            else{
                            console.log("build pdf success:sampleid is:"+generic.sampleid)
                            // //发送短信消息
                            // let parmData = new URLSearchParams();
                            // parmData.append("sampleid",generic.sampleid);
                            // parmData.append("tel",generic.tel);
                            // let url='https://bainuo.beijingepidial.com/admin/generic/client/sms'
                            // await axios.post(url,parmData);
                            // console.log("send msg success,tel is:"+generic.tel)
                            res.send("success")
                            }
                        })()
                    })
                }
            });
            // result.pdf=result.sampleid + '.pdf'
        }
    })
})
//肝癌后台报告页面生成pdf报告
app.post("/admin/liver/build/liver/pdf", (req, res) => {
    let id = req.body.id //根据样本id查询到那条记录，然后根据这个ID 查询数据返回htmlpage给浏览器显示
    wkhtmltopdf.command = __dirname + "\\wkhtmltopdf.exe"
        //wkhtmltopdf('http://localhost:3000/admin/reportliver?id=' + id, { output: __dirname+'/public/pdffile/xx.pdf'});
    Liver.findOne({ "_id": id }, function(err, liver) {
        if (err) { console.info(err) } else if (liver) { // true false 0 1 undefind=false 有值=true
            //let html = result.reportPage
            let pdfpath = __dirname + '/public/pdffile/' + liver.sampleid + '.pdf'
                //wkhtmltopdf(html.replace(/block/g, "none"), { output: spath })
                //把html变为一个文件,有了文件路径 就可以执行window-x64-phantomjs.exe命令不要担心双引号拼接字符串问题
            let phantomjs = platform.indexOf("win") != -1 ? "window-x64-phantomjs.exe" : "linux-x64-phantomjs.exe"
            console.info(__dirname + "/" + phantomjs + " " + __dirname + "/rasterize-liver.js https://bainuo.beijingepidial.com/admin/liver/report?id=" + id + " " + pdfpath)
            child.exec(__dirname + "/" + phantomjs + " " + __dirname + "/rasterize-liver.js https://bainuo.beijingepidial.com/admin/liver/report?id=" + id + " " + pdfpath, function(err, data) {
                if (err) { res.send("fail") } else {

                    Liver.updateOne({ "_id": id }, { $set: { pdf: liver.sampleid + '.pdf',status:"Completed",pdfbuildate:req.body.pdfbuildate?req.body.pdfbuildate:liver.pdfbuildate } }, function(err, status) {


                        (async() => {
                            if (err) console.info(err)
                            else{
                            console.log("build pdf success:sampleid is:"+liver.sampleid)
                            // //发送短信消息
                            // let parmData = new URLSearchParams();
                            // parmData.append("sampleid",liver.sampleid);
                            // parmData.append("tel",liver.tel);
                            // let url='https://bainuo.beijingepidial.com/admin/liver/client/sms'
                            // await axios.post(url,parmData);
                            // console.log("send msg success,tel is:"+liver.tel)
                            res.send("success")
                            }
                        })()
                    })
                }
            });
            // result.pdf=result.sampleid + '.pdf'
        }
    })
})
//宫颈癌后台报告页面生成pdf报告
app.post("/admin/hpv/build/liver/pdf", (req, res) => {
    let id = req.body.id //根据样本id查询到那条记录，然后根据这个ID 查询数据返回htmlpage给浏览器显示
    wkhtmltopdf.command = __dirname + "\\wkhtmltopdf.exe"
        //wkhtmltopdf('http://localhost:3000/admin/reportliver?id=' + id, { output: __dirname+'/public/pdffile/xx.pdf'});
    console.info("build pdf id--->"+id)
    Liver.findOne({ "_id": id }, function(err, liver) {
      
        if (err) { console.info(err) } else if (liver) { // true false 0 1 undefind=false 有值=true
            //let html = result.reportPage
            let pdfpath = __dirname + '/public/pdffile/' + liver.sampleid + '.pdf'
                //wkhtmltopdf(html.replace(/block/g, "none"), { output: spath })
                //把html变为一个文件,有了文件路径 就可以执行window-x64-phantomjs.exe命令不要担心双引号拼接字符串问题
            let phantomjs = platform.indexOf("win") != -1 ? "window-x64-phantomjs.exe" : "linux-x64-phantomjs.exe"
            console.info(__dirname + "/" + phantomjs + " " + __dirname + "/rasterize-liver.js https://bainuo.beijingepidial.com/admin/liver/report?id=" + id + " " + pdfpath)
            child.exec(__dirname + "/" + phantomjs + " " + __dirname + "/rasterize-liver.js https://bainuo.beijingepidial.com/admin/liver/report?id=" + id + " " + pdfpath, function(err, data) {
                if (err) { res.send("fail") } else {
                    Liver.updateOne({ "_id": id }, { $set: { pdf: liver.sampleid + '.pdf',status:"Completed" } }, function(err, status) {
                        (async() => {
                            if (err) console.info(err)
                            else{
                            console.log("build pdf success:sampleid is:"+liver.sampleid)
                            // //发送短信消息
                            // let parmData = new URLSearchParams();
                            // parmData.append("sampleid",liver.sampleid);
                            // parmData.append("tel",liver.tel);
                            // let url='https://bainuo.beijingepidial.com/admin/liver/client/sms'
                            // await axios.post(url,parmData);
                            // console.log("send msg success,tel is:"+liver.tel)
                            res.send("success")
                            }
                        })()
                    })
                }
            });
            // result.pdf=result.sampleid + '.pdf'
        }
    })
})
//生物学年龄后台点击“生成pdf报告”按钮
app.post("/admin/epiage/buildpdf", (req, res) => {
    let id = req.body.id //根据样本id查询到那条记录，然后根据这个ID 查询数据返回htmlpage给浏览器显示
    console.log(req.body.sampleid)
    wkhtmltopdf.command = __dirname + "\\wkhtmltopdf.exe"
        //wkhtmltopdf('http://localhost:3000/admin/reportliver?id=' + id, { output: __dirname+'/public/pdffile/xx.pdf'});
    Epiage.findOne({ "_id": id }, function(err, epiage) {
        if (err) { console.info(err) } else if (epiage) { // true false 0 1 undefind=false 有值=true
            let pdfname = epiage.sampleid + '.pdf'
            let pdfpath = __dirname + '/public/pdffile/' + pdfname
                //wkhtmltopdf(html.replace(/height:600px;width: 950px;margin-top: 200px;margin-left: 50px;/, "height:600px;width: 950px;margin-top: 200px;margin-left: 50px;"), { output: spath })
                //把html变为一个文件,有了文件路径 就可以执行window-x64-phantomjs.exe命令不要担心双引号拼接字符串问题
            let phantomjs = platform.indexOf("win") != -1 ? "window-x64-phantomjs.exe" : "linux-x64-phantomjs.exe"
            console.info(__dirname + "/" + phantomjs + " " + __dirname + "/rasterize.js https://bainuo.beijingepidial.com/admin/epiage/report?buildstr=" + id + "@build " + pdfpath)
            child.exec(__dirname + "/" + phantomjs + " " + __dirname + "/rasterize.js https://bainuo.beijingepidial.com/admin/epiage/report?buildstr=" + id + "@build " + pdfpath, function(err, data) {
                if (err) { console.info(err) } else {
                    Epiage.updateOne({ "_id": id }, { $set: { pdf: pdfname,status:"Completed",pdfbuildate:req.body.pdfbuildate?req.body.pdfbuildate:epiage.pdfbuildate } }, function(err, rs) {
                        (async() => {
                            if (err) console.info(err)
                            else{
                            console.log("build pdf success:sampleid is:"+epiage.sampleid)
                            // let parmData = new URLSearchParams();
                            // parmData.append("sampleid",epiage.sampleid);
                            // parmData.append("tel",epiage.tel);
                            // //发送短信消息
                            // let url='https://bainuo.beijingepidial.com/admin/epiage/client/sms'
                            // await axios.post(url,parmData);
                            // console.log("send msg success,tel is:"+epiage.tel)
                            res.send("success")
                            }
                        })()
                    })
                }
            });
            // result.pdf=result.sampleid + '.pdf'

        }
    })
})
//宫颈癌后台报告页面生成pdf报告
app.post("/admin/hpv/buildliverpdf", (req, res) => {
    let id = req.body.id //根据样本id查询到那条记录，然后根据这个ID 查询数据返回htmlpage给浏览器显示
    wkhtmltopdf.command = __dirname + "\\wkhtmltopdf.exe"
        //wkhtmltopdf('http://localhost:3000/admin/reportliver?id=' + id, { output: __dirname+'/public/pdffile/xx.pdf'});
    console.info("id--->"+id)
    Hpv.findOne({ "_id": id }, function(err, result) {
        if (err) { console.info(err) } else if (result) { // true false 0 1 undefind=false 有值=true
            //let html = result.reportPage
            let pdfpath = __dirname + '/public/pdffile/' + result.sampleid + '.pdf'
                //wkhtmltopdf(html.replace(/block/g, "none"), { output: spath })
                //把html变为一个文件,有了文件路径 就可以执行window-x64-phantomjs.exe命令不要担心双引号拼接字符串问题
            let phantomjs = platform.indexOf("win") != -1 ? "window-x64-phantomjs.exe" : "linux-x64-phantomjs.exe"
            console.info(__dirname + "/" + phantomjs + " " + __dirname + "/rasterize-liver.js https://bainuo.beijingepidial.com/admin/hpv/report?id=" + id + " " + pdfpath)
            child.exec(__dirname + "/" + phantomjs + " " + __dirname + "/rasterize-liver.js https://bainuo.beijingepidial.com/admin/hpv/report?id=" + id + " " + pdfpath, function(err, data) {
                if (err) { console.info(err) } else {
                    Hpv.updateOne({ "_id": id }, { $set: { pdf: result.sampleid + '.pdf',status:"Completed" } }, function(err, status) {
                        if (err) console.info(err)
                        res.send("success")
                    })
                }
            });
            // result.pdf=result.sampleid + '.pdf'
        }
    })
})
//接受微信小程序端传过来的appid,secret,code返回openid给小程序
app.get("/bainuo/mini/login", (req, res) => {
    const code = req.query.code //拿到传过来的code
        //调用 auth.code2Session接口，换取用户唯一标识 OpenID 和 会话密钥 session_key
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${appsecret}&js_code=${code}&grant_type=authorization_code`
    request(url, (req, response, body) => {
        res.send(body) //将请求到的 OpenID与 session_key 返回给小程序页面js文件
    })


})

//宫颈癌后台生成pdf报告
app.post("/admin/epihpv/buildhpvpdf", (req, res) => {
    let barcode = req.body.barcode //根据样本id查询到那条记录，然后根据这个ID 查询数据返回htmlpage给浏览器显示
        // console.log("this is the barcode " + barcode)
        //_dirname代表项目在本地计算机上的路径地址“D:\usr\local\workspace\bainuoserver”
    wkhtmltopdf.command = __dirname + "/wkhtmltopdf.exe"
        // wkhtmltopdf('http://localhost:3000/admin/reportepiage?id=' + id, { output: __dirname+'/public/pdffile/xx.pdf'});
    connection.query("select rephtml from  epihpvrep where barcode= ?", [barcode], function(err, result) {
        // console.info(result[0] !== undefined)
        if (err) {
            console.info(err)
        } else if (result[0] && result[0].rephtml) { // true false 0 1 undefind=false 有值=true
            let html = result[0].rephtml
            var spath = __dirname + '/public/pdffile/' + barcode + '.pdf'
                //根据获取到的字符串生成pdf，并保存生成pdf的路径spath
            wkhtmltopdf(html.replace(/block/g, "none"), { output: spath })
                // result.pdf=result.sampleid + '.pdf'
            connection.query("update epihpvrep set url=? where barcode=?", ['public/pdffile/' + barcode + '.pdf', barcode], function(err, result) {
                if (err) {
                    console.info(err)
                }
                res.send("success")
            })
        }

    })
})

//点击report parameter查看hpv报告页面时，根据传过来的barcode查询数据库的两个表report,result。并返回对应客户的所有数据到页面。搜索对应数据返回去客户端页面展示
app.get('/admin/epihpvpdf', (req, res) => {
    // console.info(req.query.barcode)
    connection.query("select * from  report where report.barcode=?", [req.query.barcode], (err, results, fields) => {
        if (err) {
            logger.error(err);
        } else {
            res.render('back/epihpvpdf', { "data": results[0] })
        }

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

//肝癌筛查左边栏
// app.get("/admin/memberLiver", (req, res) => {
//   //查询数据库数据
//   let vdata = {}
//   Liver.find(vdata, function (err, result) {
// console.info(result==undefined)
// if (result && result.length != 0) {
//     res.render('back/member-list-liver', { "data": result, "count": result.length }) //把数据传递给客户端页面
// }
//   }).sort({ "_id": -1 }).skip(0).limit(50)

// })
//肝癌报告页面删除一条数据
app.post("/admin/generic/delreport", (req, res) => {
    // console.log("删除的id是： " + req.body.id)
    Generic.deleteOne({ sampleid: req.body.sampleid }, function(err, result) {
        if (err) console.info(err)
        Genericuser.deleteOne({ sampleid: req.body.sampleid }, (err, rs) => {
            if (err) console.info(err)
            res.send("success")
        })
    })
})
//肝癌报告页面删除一条数据
app.post("/admin/liver/delreport", (req, res) => {
        // console.log("删除的id是： " + req.body.id)
        Liver.deleteOne({ sampleid: req.body.sampleid }, function(err, result) {
            if (err) console.info(err)
            Liveruser.deleteOne({ sampleid: req.body.sampleid }, (err, rs) => {
                if (err) console.info(err)
                res.send("success")
            })
        })
    })
    //生物学年龄报告页面删除一条数据
app.post("/admin/epiage/delreport", (req, res) => {
    // console.log("生物学年龄报告页面删除的id是： " + req.body.id)
    Epiage.deleteOne({ sampleid: req.body.sampleid }, function(err, result) {
        if (err) console.info(err)
        Epiageuser.deleteOne({ sampleid: req.body.sampleid }, (err, rs) => {
            if (err) console.info(err)
            res.send("success")
        })
    })
})
 //肝癌批量上传核验单删除一条数据  
    app.post("/admin/liver/review/delete", (req, res) => {
        // console.log("删除的id是： " + req.body.id)
        LiverReview.deleteOne({ _id: req.body.id }, function(err, result) {
            if (err) console.info(err)
            res.send("success")
        })
    })
    
 //生物学年龄批量上传核验单删除一条数据  
 app.post("/admin/epiage/review/delete", (req, res) => {
    // console.log("删除的id是： " + req.body.id)
    EpiageReview.deleteOne({ _id: req.body.id }, function(err, result) {
        if (err) console.info(err)
        res.send("success")
    })
})
     //泛癌后台报告页面批量发送报告
     app.post("/admin/generic/batch/send/msg",async (req, res)=>{
        for(let i=0;i<req.body.ids.length;i++){
            let fcc=await Generic.findOne({_id:req.body.ids[i]},{tel:1,sampleid:1,pdf:1})
            if(fcc.pdf){
                //发送短信消息
                let parmData = new URLSearchParams();
                parmData.append("sampleid",fcc.sampleid);
                parmData.append("tel",fcc.tel);
                let url='https://bainuo.beijingepidial.com/admin/generic/client/sms'
                await axios.post(url,parmData);
                new Date().sleep(1000)
                console.log("send msg success,tel is:"+fcc.tel)
            }else{
                console.log(fcc.tel+" report unbuild ,can not send msg")
            }
        }
        res.send("success")
    })
      //生物学年龄后台报告页面批量发送短信
      app.post("/admin/epiage/batch/send/msg",async (req, res)=>{
        for(let i=0;i<req.body.ids.length;i++){
            let fcc=await Epiage.findOne({_id:req.body.ids[i]},{tel:1,sampleid:1,pdf:1})
            if(fcc.pdf){
                //发送短信消息
                let parmData = new URLSearchParams();
                parmData.append("sampleid",fcc.sampleid);
                parmData.append("tel",fcc.tel);
                let url='https://bainuo.beijingepidial.com/admin/epiage/client/sms'
                await axios.post(url,parmData);
                new Date().sleep(1000)
                console.log("send msg success,tel is:"+fcc.tel)
            }else{
                console.log(fcc.tel+" report unbuild ,can not send msg")
            }
        }
        res.send("success")
    })
    //肝癌后台报告页面批量发送短信
    app.post("/admin/liver/batch/send/msg",async (req, res)=>{
        for(let i=0;i<req.body.ids.length;i++){
            let fcc=await Liver.findOne({_id:req.body.ids[i]},{tel:1,sampleid:1,pdf:1})
            if(fcc.pdf){
                //发送短信消息
                let parmData = new URLSearchParams();
                parmData.append("sampleid",fcc.sampleid);
                parmData.append("tel",fcc.tel);
                let url='https://bainuo.beijingepidial.com/admin/liver/client/sms'
                await axios.post(url,parmData);
                new Date().sleep(1000)
                console.log("send msg success,tel is:"+fcc.tel)
            }else{
                console.log(fcc.tel+" report unbuild ,can not send msg")
            }
        }
        res.send("success")
    })
    //肝癌复核单批量生成报告
    app.post("/admin/liver/review/batch/build/pdf", async (req, res)=>{
        console.info(req.body.ids)
        try{
                    for(let i=0;i<req.body.ids.length;i++){
                        let liverreview=await LiverReview.findOne({_id:req.body.ids[i]})
                        let dbliverlib=await LiverLib.findOne({sampleid:liverreview.sampleid})
                        let dbliver=await Liver.findOne({sampleid:liverreview.sampleid})
                        let liveruser={}
                        liveruser.sampleid=liverreview.sampleid
                        liveruser.username=liverreview.username
                        liveruser.tel=liverreview.tel
                        liveruser.sex=(liverreview.sex=="男"?0:1)
                        liveruser.created=new Date().format("yyyy-MM-dd")
                        liveruser.age=liverreview.age;
                        liveruser.post=dbliverlib?dbliverlib.post:"";
                        
                        let liver={}
                        liver.sampleid=liverreview.sampleid
                        liver.tel=liverreview.tel
                        liver.mval=liverreview.mval
                        liver.chance=liverreview.probability
                        liver.date=liverreview.collectionDate
                        liver.recdate=liverreview.reciveDate //样本接收日期
                        liver.status=liverreview.testStatus;
                        liver.pdfbuildate=req.body.pdfbuildate
                        if(!dbliverlib&&dbliver){//无库存但报告页面有此条数据
                            await Liveruser.updateOne({ "sampleid": liveruser.sampleid }, { $set: { username: liveruser.username,tel:liverreview.tel,sex:liveruser.sex ,created:liveruser.created,age:liveruser.age,} })
                            await Liver.updateOne({ "sampleid": liver.sampleid }, { $set: { tel: liver.tel,mval:liver.mval,chance:liver.chance ,date:liver.date,recdate:liver.recdate,status:liver.status,pdfbuildate:liver.pdfbuildate} })
                            await LiverReview.deleteMany({sampleid:liver.sampleid})
                        }
                        if(dbliverlib){
                            await new Liver(liver).save()
                            await new Liveruser(liveruser).save()
                            await LiverReview.deleteOne({_id:req.body.ids[i]})
                            await LiverLib.deleteOne({sampleid:liverreview.sampleid})
                        }
                        
            
                        //生成PDF报告
                        let fucc=await Liver.findOne({sampleid:liverreview.sampleid},{_id:1})
                        let parmData = new URLSearchParams();
                        parmData.append("id", fucc._id);
                        let url='https://bainuo.beijingepidial.com/admin/liver/build/liver/pdf'
                        await axios.post(url,parmData);
                    }
                    res.send("success")     
        }catch(e){
            console.info(e)
            res.send("fail")
        }
       
    })
 //宫颈癌癌复核单批量生成报告
 app.post("/admin/hpv/review/batch/build/pdf", async (req, res)=>{
    try{
        for(let i=0;i<req.body.ids.length;i++){
            let hpvreview=await HpvReview.findOne({_id:req.body.ids[i]})
            let dbhpvlib=await HpvLib.findOne({sampleid:hpvreview.sampleid})
            let hpvuser={}
            hpvuser.sampleid=hpvreview.sampleid
            hpvuser.username=hpvreview.username
            hpvuser.tel=hpvreview.tel
            hpvuser.sex=(hpvreview.sex=="男"?0:1)
            hpvuser.created=new Date().format("yyyy-MM-dd")
            hpvuser.age=hpvreview.age;
            hpvuser.post=dbhpvlib.post;
            await new Hpvuser(hpvuser).save()
            let hpv={}
            hpv.sampleid=hpvreview.sampleid
            hpv.tel=hpvreview.tel
            hpv.mval=hpvreview.mval
            hpv.chance=hpvreview.probability
            hpv.date=hpvreview.collectionDate
            hpv.recdate=hpvreview.reciveDate //样本接收日期
            hpv.status=hpvreview.testStatus;
            await new Hpv(hpv).save()

            await HpvReview.deleteOne({_id:req.body.ids[i]})
            await HpvLib.deleteOne({sampleid:hpvreview.sampleid})

            //生成PDF报告
            let fucc=await Hpv.findOne({sampleid:hpvreview.sampleid},{_id:1})
            let parmData = new URLSearchParams();
            parmData.append("id", fucc._id);
            let url='https://bainuo.beijingepidial.com/admin/hpv/build/hpv/pdf'
            await axios.post(url,parmData);
        }
        res.send("success")
    }catch(e){
        console.info(e)
        res.send("fail")
    }
})
 app.post("/admin/liver/review/check/comfirm", (req, res) => {
        // console.log("删除的id是： " + req.body.id)       
            (async() => {
		        let liverreview=await LiverReview.findOne({_id: req.body.id})
                let dbliverlib=await LiverLib.findOne({sampleid: req.body.sampleid})
                if(dbliverlib){
                    let transaction=new Transaction(true)
                    try{
                    await transaction.remove("LiverLib",dbliverlib._id);
                    //let liverreview=await LiverReview.findOne({_id: req.body.id})
                    let liveruser={}
                    liveruser.sampleid=liverreview.sampleid
                    liveruser.username=liverreview.username
                    liveruser.tel=liverreview.tel
                    liveruser.sex=(liverreview.sex=="男"?0:1)
                    liveruser.created=liverreview.collectionDate;
                    liveruser.age=liverreview.age;
	                liveruser.post=dbliverlib.post;		    
                    await transaction.insert("Liveruser", liveruser);
                    let liver={}
                    liver.sampleid=liverreview.sampleid
                    liver.tel=liverreview.tel
                    liver.mval=liverreview.mval
                    liver.chance=liverreview.probability
                    liver.date=liverreview.collectionDate
                    liver.recdate=liverreview.reciveDate //样本接收日期
                    liver.status=liverreview.testStatus;
                    liver.pdfbuildate=req.body.pdfbuildate
                    await transaction.insert("Liver", liver);
                    await transaction.run();
                    }catch(e){
                        await transaction.rollback().catch(console.error)
                        console.info("liver barcode:"+liver.sampleid+" report transaction rollback……")
                    }finally{
                        await transaction.clean()
                    }
                }else{
                    await Liver.updateOne( { "sampleid": req.body.sampleid }, { $set:{"tel":req.body.tel,mval:liverreview.mval,chance:liverreview.probability,date:liverreview.collectionDate,recdate:liverreview.reciveDate,pdfbuildate:req.body.pdfbuildate}});
                    await Liveruser.updateOne( {"sampleid": req.body.sampleid }, { $set:{"username":req.body.username,"tel":req.body.tel,sex:req.body.sex,"age":req.body.age}});

                }
                await LiverReview.deleteMany({ sampleid: req.body.sampleid });
                let fucc=await Liver.findOne({sampleid:req.body.sampleid},{_id:1});
                let parmData = new URLSearchParams();
                parmData.append("id", fucc._id);
                //生成PDF报告
                let url='https://bainuo.beijingepidial.com/admin/liver/build/liver/pdf';
                await axios.post(url,parmData);
                res.send("success")
        })()
           
    })
    app.post("/admin/epiage/review/check/comfirm", (req, res) => {
        // console.log("删除的id是： " + req.body.id)       
            (async() => {
		        let epiagereview=await EpiageReview.findOne({_id: req.body.id})
                
                let dbepiagelib=await EpiageLib.findOne({sampleid: req.body.sampleid})
                if(dbepiagelib){
                    let transaction=new Transaction(true)
                    try{
                    await transaction.remove("EpiageLib",dbepiagelib._id);
                    //let liverreview=await LiverReview.findOne({_id: req.body.id})
                    let epiageuser={}
                    epiageuser.sampleid=epiagereview.sampleid
                    epiageuser.username=epiagereview.username
                    epiageuser.tel=epiagereview.tel
                    epiageuser.sex=(epiagereview.sex=="男"?0:1)
                    epiageuser.created=epiagereview.collectionDate;
                    epiageuser.age=epiagereview.epiage;
	                epiageuser.post=dbepiagelib.post;		    
                    await transaction.insert("Epiageuser", epiageuser);
                   

                    let epiage={}
                    epiage.sampleid=epiagereview.sampleid
                    epiage.tel=epiagereview.tel
                    epiage.chroage=epiagereview.chroage
                    epiage.epiage=epiagereview.epiage
                    epiage.accuracy=epiagereview.accuracy
                    epiage.date=epiagereview.collectionDate
                    epiage.recdate=epiagereview.reciveDate //样本接收日期
                    epiage.status=epiagereview.testStatus;
                    epiage.pdfbuildate=req.body.pdfbuildate
                    await transaction.insert("Epiage", epiage);
                    await transaction.run();
                    }catch(e){
                        await transaction.rollback().catch(console.error)
                        console.info("epiage barcode:"+epiage.sampleid+" report transaction rollback……")

                    }finally{
                        await transaction.clean()
                    }
                }else{
                    await Epiage.updateOne( { "sampleid": req.body.sampleid }, { $set:{"tel":req.body.tel,chroage:epiagereview.chroage,epiage:epiagereview.epiage,accuracy:epiagereview.accuracy,date:epiagereview.collectionDate,recdate:epiagereview.reciveDate,pdfbuildate:req.body.pdfbuildate}});
                    await Epiageuser.updateOne( {"sampleid": req.body.sampleid }, { $set:{"username":req.body.username,"tel":req.body.tel,sex:req.body.sex,"age":req.body.age}});

                }
                await EpiageReview.deleteMany({ sampleid: req.body.sampleid });
                let fucc=await Epiage.findOne({sampleid:req.body.sampleid},{_id:1});
                let parmData = new URLSearchParams();
                parmData.append("id", fucc._id);
                //生成PDF报告
                let url='https://bainuo.beijingepidial.com/admin/epiage/buildpdf';

                await axios.post(url,parmData);
                res.send("success")
        })()
           
    })
    //肝癌报告页面删除一条数据
app.post("/admin/hpv/delreport", (req, res) => {
    // console.log("删除的id是： " + req.body.id)
    Hpv.deleteOne({ sampleid: req.body.sampleid }, function(err, result) {
        if (err) console.info(err)
        Hpvuser.deleteOne({ sampleid: req.body.sampleid }, (err, rs) => {
            if (err) console.info(err)
            res.send("success")
        })
    })
})
    //生物学年龄检测左边栏，点击查询hddatabase数据库并返回所有用户的report表数据
app.get("/admin/hpv/member", (req, res) => {
        //查询数据库数据 
        connection.query("select * from  report", (err, results, fields) => {
            if (err) {
                logger.error(err);
            } else {
                // console.info(results)
                res.render('back/member-list-hdhpvreport', { "data": results, "count": results.length })
            }

        })

    })
    //肝癌筛查左边下拉栏
app.get("/admin/member-show", (req, res) => {
    let id = req.query.id
        //查询数据库数据
    Liver.findOne({ _id: id }, function(err, result) {
        // res.render('back/member-list', { "data": result }) //把数据传递给客户端页面
    })
})

//生物学年龄检测左边下拉栏
app.get("/admin/member-show", (req, res) => {
        let id = req.query.id
            //查询数据库数据
        Liver.findOne({ _id: id }, function(err, result) {
            // res.render('back/member-list', { "data": result }) //把数据传递给客户端页面
        })
    })

//把报告页面输入的数据保存到数据库时，判断是否已经有这几条数据，有就更新，没有就插入
app.post("/admin/epihpv/updateval", (req, res) => {

        // req.body.barcode

        // console.info("select barcode,samplesta,deliverdoc,deliverdoctel from epihpvrep where barcode='"+req.body.barcode+"'")
        connection.query("select barcode,samplesta,deliverdoc,deliverdoctel from epihpvrep where barcode=?", [req.body.barcode], (err, results) => {
            if (err) {
                logger.error(err);
            } else {
                console.info("xxxxxxxx")
                console.info(results[0])
                if (results[0]) {
                    // console.info("update epihpvrep set "+req.body.col+"='"+req.body.val+"' where barcode='"+req.body.barcode+"'")
                    connection.query("update epihpvrep set " + req.body.col + "=? where barcode=?", [req.body.val, req.body.barcode], (err, res) => {
                        if (err) {
                            console.info(err);
                        }
                    })
                } else {
                    // console.info("insert into epihpvrep(barcode,"+ req.body.col +") values('"+req.body.barcode+"','"+req.body.val+"')")
                    connection.query("insert into epihpvrep(barcode," + req.body.col + ") values(?,?)", [req.body.barcode, req.body.val], (err, res) => {
                        if (err) {
                            console.info(err)
                        }
                    })
                }
                // res.send("success")
            }

        })

    })
    //宫颈癌报告查询
app.post("/admin/saveHpvReport", (req, res) => {
    //根据客户端传来的id查询并更新、插入对应数据
    // console.log("select * from epihpvrep where barcode=?", [req.body.barcode])
    connection.query("select * from epihpvrep where barcode=?", [req.body.barcode], (err, results) => {
        if (err) {
            logger.error(err);
        } else {
            if (results[0]) {
                // console.info("update epihpvrep set rephtml=? where barcode=?")
                connection.query("update epihpvrep set rephtml=? where barcode=?", [req.body.reportPage, req.body.barcode], (err, res) => {
                    if (err) {
                        console.info(err);
                    }
                })
            } else {
                // console.info("insert into epihpvrep(barcode,rephtml) values(?,?)")
                connection.query("insert into epihpvrep(barcode,rephtml) values(?,?)", [req.body.barcode, req.body.reportPage], (err, res) => {
                    if (err) {
                        console.info(err)
                    }
                })
            }
            res.send("success")
        }

    })
})

//肝癌报告与生物学年龄报告-----------------------------------------------------------

//肝癌条码，用户一旦注册，改注册的条码就从库存到报告页面。同时该报告页面就会被保存进数据库，id查询报告
Date.prototype.format = function(fmt) {
    var o = {
        "M+": this.getMonth() + 1, //月份 
        "d+": this.getDate(), //日 
        "h+": this.getHours(), //小时 
        "m+": this.getMinutes(), //分 
        "s+": this.getSeconds(), //秒 
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度 
        "S": this.getMilliseconds() //毫秒 
    };
    if (/(y+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    }
    for (var k in o) {
        if (new RegExp("(" + k + ")").test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        }
    }
    return fmt;
}
Date.prototype.sleep=function(delay) {
    let start = (new Date()).getTime();
    while ((new Date()).getTime() - start < delay) {continue;}
}
//泛癌后台报告页面，点击“查看报告”
app.get("/admin/generic/report", (req, res) => {
    //req.query获取的是通过链接地址传递过来的数据
    let id = req.query.id //根据样本id查询到那条记录，然后根据这个ID 查询数据返回htmlpage给浏览器显示
Generic.findOne({ _id: id }, function(err, generic) {
        if (err) {console.info(err)}
     if(!generic) {res.send("查无次条码报告");return}
            //如果result.reportPage没有值返回undefined，但result.reportPage有值返回已经保存的页面
            //!result.reportPage表示result.reportPage有值，返回数据库中的页面      
            // let  genericuser = await  genericuser.findOne({ sampleid: generic.sampleid }) //如果没值返回页面
            Genericuser.findOne({ "sampleid": generic.sampleid }, (err, genericuser) => {
                console.info("++++++++")
                console.info(genericuser)
            if (err) { console.info(err) } else if (genericuser) {
                (async()   =>   {
                    if( genericuser.idCard){
                        genericuser.idxSexStart= (genericuser.idCard.length == 18) ? 16 : 14;
                        genericuser.idxSex = 1 - genericuser.idCard.substr(genericuser.idxSexStart, 1) % 2
                        genericuser.gender= (genericuser.idxSex == 1 ? '女' : '男')
                        genericuser.age= new Date().getFullYear() - parseInt(genericuser.idCard.substr(6, 4))
                        genericuser.idCard =genericuser.idCard.substr(0, 6) + "*************"
                    }else{
                        genericuser.idCard="未填写"
                        genericuser.gender=genericuser.sex?(genericuser.sex==1?'女':'男'):"未填写"
                        genericuser.age=genericuser.age?genericuser.age:"未填写"
                    }
                    //genericuser.idxSexStart = genericuser.idCard ? genericuser.idCard.length == 18 ? 16 : 14 : "未填写";
                    //genericuser.curAge = genericuser.idCard ? new Date().getFullYear() - parseInt(genericuser.idCard.substr(6, 4)) : "未填写";
                    //genericuser.idxSex = genericuser.idCard ? 1 - genericuser.idCard.substr(genericuser.idxSexStart, 1) % 2 : "未填写";
                    //genericuser.gender = genericuser.idCard ? (genericuser.idxSex == 1 ? '女' : '男') : (genericuser.sex == 1 ? '女' : '男');
                    //genericuser.idCard = genericuser.idCard ? genericuser.idCard.substr(0, 6) + "*************" : "未填写"

                    genericuser.mval = generic.mval
                    genericuser.chance = (generic.chance*100).toFixed(1)
                    genericuser.pdfcreated = new Date().format("yyyy-MM-dd")
                    genericuser.pdfcreated = generic.pdfbuildate?generic.pdfbuildate:"未填写"
                    generic.reportPage = await  fs.promises.readFile(__dirname  +  '/views/back/pdfhtml/genericreport.html',  'utf-8')
                    console.info(genericuser.chance)
                    let html = generic.reportPage.replace(/#username/, genericuser.username)
                        .replace(/#mval/, genericuser.mval)
                        .replace(/#chance/, genericuser.chance)
                        .replace(/#sampleid/, genericuser.sampleid)
                        .replace(/#idCard/, genericuser.idCard)
                        .replace(/#created/g, generic.date)
                        .replace(/#gender/, genericuser.gender)
                        .replace(/#pdfcreated/, genericuser.pdfcreated)
                        .replace(/#age/, genericuser.age)
                        .replace(/#date/,genericuser.created)
                        .replace(/#recdate/, generic.recdate?generic.recdate:"未填写")
                        // console.info(html)
                        //et dvalue = html.replace("/range1tu[0-5]{1}/g", "range1tu<%=data.dnaval%>").replace(/scroe:[0-5]{1}/,"range1tu<%=data.dnaval%>")
                        //res.render(dvalue, { "data": result })//render如何把字符串输出到页面
                    res.send(html)
                })()


            }
        })

        //如果没值返回页面
    })
})
//肝癌后台报告页面，点击“编辑报告”
app.get("/admin/liver/report", (req, res) => {
        //req.query获取的是通过链接地址传递过来的数据
        let id = req.query.id //根据样本id查询到那条记录，然后根据这个ID 查询数据返回htmlpage给浏览器显示
	Liver.findOne({ _id: id }, function(err, liver) {
        console.info(liver.pdfbuildate)
            if (err) {console.info(err)}
	     if(!liver) {res.send("查无次条码报告");return}
                //如果result.reportPage没有值返回undefined，但result.reportPage有值返回已经保存的页面
                //!result.reportPage表示result.reportPage有值，返回数据库中的页面      
                // let  liveruser = await  Liveruser.findOne({ sampleid: liver.sampleid }) //如果没值返回页面
            Liveruser.findOne({ "sampleid": liver.sampleid }, (err, liveruser) => {
                if (err) { console.info(err) } else if (liveruser) {
                    (async()   =>   {
                        if( liveruser.idCard){
                            liveruser.idxSexStart= (liveruser.idCard.length == 18) ? 16 : 14;
                            liveruser.idxSex = 1 - liveruser.idCard.substr(liveruser.idxSexStart, 1) % 2
                            liveruser.gender= (liveruser.idxSex == 1 ? '女' : '男')
                            liveruser.age= new Date().getFullYear() - parseInt(liveruser.idCard.substr(6, 4))
                            liveruser.idCard =liveruser.idCard.substr(0, 6) + "*************"
                        }else{
                            liveruser.idCard="未填写"
                            liveruser.gender=liveruser.sex?(liveruser.sex==1?'女':'男'):"未填写"
                            liveruser.age=liveruser.age?liveruser.age:"未填写"
                        }
                        //liveruser.idxSexStart = liveruser.idCard ? liveruser.idCard.length == 18 ? 16 : 14 : "未填写";
                        //liveruser.curAge = liveruser.idCard ? new Date().getFullYear() - parseInt(liveruser.idCard.substr(6, 4)) : "未填写";
                        //liveruser.idxSex = liveruser.idCard ? 1 - liveruser.idCard.substr(liveruser.idxSexStart, 1) % 2 : "未填写";
                        //liveruser.gender = liveruser.idCard ? (liveruser.idxSex == 1 ? '女' : '男') : (liveruser.sex == 1 ? '女' : '男');
                        //liveruser.idCard = liveruser.idCard ? liveruser.idCard.substr(0, 6) + "*************" : "未填写"
                        liveruser.mval = liver.mval
                        liveruser.chance = liver.chance
                        liveruser.pdfcreated = liver.pdfbuildate?liver.pdfbuildate:"未填写"
                        liver.reportPage = await  fs.promises.readFile(__dirname  +  '/views/back/pdfhtml/liverreport.html',  'utf-8')

                        let html = liver.reportPage.replace(/#username/, liveruser.username)
                            .replace(/#mval/, liveruser.mval)
                            .replace(/#chance/, liveruser.chance)
                            .replace(/#sampleid/, liveruser.sampleid)
                            .replace(/#idCard/, liveruser.idCard)
                            .replace(/#created/g, liver.date)
                            .replace(/#gender/, liveruser.gender)
                            .replace(/#pdfcreated/, liveruser.pdfcreated)
                            .replace(/#age/, liveruser.age)
                            .replace(/#date/, liver.date)
                            .replace(/#recdate/, liver.recdate?liver.recdate:"未填写")
                            // console.info(html)
                            //et dvalue = html.replace("/range1tu[0-5]{1}/g", "range1tu<%=data.dnaval%>").replace(/scroe:[0-5]{1}/,"range1tu<%=data.dnaval%>")
                            //res.render(dvalue, { "data": result })//render如何把字符串输出到页面
                        res.send(html)
                    })()


                }
            })

            //如果没值返回页面
        })
    })
    //宫颈癌后台报告页面，点击“编辑报告”
app.get("/admin/hpv/report", (req, res) => {
    //req.query获取的是通过链接地址传递过来的数据
    let id = req.query.id //根据样本id查询到那条记录，然后根据这个ID 查询数据返回htmlpage给浏览器显示
Hpv.findOne({ _id: id }, function(err, hpv) {
        if (err) {console.info(err)}
     if(!hpv) {res.send("查无次条码报告");return}
            //如果result.reportPage没有值返回undefined，但result.reportPage有值返回已经保存的页面
            //!result.reportPage表示result.reportPage有值，返回数据库中的页面      
            // let  liveruser = await  Liveruser.findOne({ sampleid: liver.sampleid }) //如果没值返回页面
            Hpvuser.findOne({ "sampleid": hpv.sampleid }, (err, hpvuser) => {

            if (err) { console.info(err) } else if (hpvuser) {
                (async()   =>   {

                    hpvuser.idCard = hpvuser.idCard
                    if(hpvuser.idCard){
                        hpvuser.idxSexStart=hpvuser.idCard.length == 18 ? 16 : 14;
                        hpvuser.idxSex=hpvuser.idCard.substr(hpvuser.idxSexStart, 1) % 2
                    }else{ hpvuser.idxSex =-1}
                    // hpvuser.idxSexStart = hpvuser.idCard ? hpvuser.idCard.length == 18 ? 16 : 14 : "未填写";
                    // hpvuser.idxSex = hpvuser.idCard ? 1 - hpvuser.idCard.substr(hpvuser.idxSexStart, 1) % 2 : "未填写";
                    hpvuser.curAge = hpvuser.idCard ? new Date().getFullYear() - parseInt(hpvuser.idCard.substr(6, 4)) : "未填写";
                    hpvuser.gender = hpvuser.idCard ? (hpvuser.idxSex == 1 ? '女' : '男') : (hpvuser.sex == 1 ? '女' : '男');
                    hpvuser.idCard = hpvuser.idCard ? hpvuser.idCard.substr(0, 6) + "*************" : "未填写"
                    hpvuser.mval = hpv.mval
                    hpvuser.chance = hpv.chance
                    hpvuser.pdfcreated = new Date().format("yyyy-MM-dd")
                    hpv.reportPage = await  fs.promises.readFile(__dirname  +  '/views/back/pdfhtml/liverreport.html',  'utf-8')

                    let html = hpv.reportPage.replace(/#username/, hpvuser.username)
                        .replace(/#mval/, hpvuser.mval)
                        .replace(/#chance/, hpvuser.chance)
                        .replace(/#sampleid/, hpvuser.sampleid)
                        .replace(/#idCard/, hpvuser.idCard)
                        .replace(/#created/g, hpv.date)
                        .replace(/#gender/, hpvuser.gender)
                        .replace(/#curAge/, hpvuser.curAge)
                        .replace(/#pdfcreated/, hpvuser.pdfcreated)
                        .replace(/#age/, hpvuser.age)
                        .replace(/#date/, hpv.date)
                        .replace(/#recdate/, hpv.recdate)
                        // console.info(html)
                        //et dvalue = html.replace("/range1tu[0-5]{1}/g", "range1tu<%=data.dnaval%>").replace(/scroe:[0-5]{1}/,"range1tu<%=data.dnaval%>")
                        //res.render(dvalue, { "data": result })//render如何把字符串输出到页面
                    res.send(html)
                })()


            }
        })

        //如果没值返回页面
    })
})
    //生物学年龄根据样本id查询编辑报告页面
app.get("/admin/epiage/report", (req, res) => {
    //分割点击“生成pdf报告”按钮时带过来的build参数，如果有build就走生成pdf替换字符串路线，如果没有就走“编辑报告”页面
    let id = req.query.buildstr.split("@")[0]
    let buildpdf = req.query.buildstr.split("@")[1]

    Epiage.findOne({ _id: id }, function(err, epiage) {
        if (err) console.info(err)
           if (err) {console.info(err)}
         if(!epiage) {res.send("查无此条码报告");return}
        Epiageuser.findOne({ "sampleid": epiage.sampleid }, (err, epiageuser) => {
                if (err) { console.info(err) } else if (epiageuser) {
                     (async()   =>   {
                        //把同一个电话号码下面的所有barcode都按照时间顺序放进数组，展现在报告界面的散点图
                        //把从数据库获取的采样时间后转化成时间戳getTime()，对时间戳排序后在排序输出
                        let epiagebox=(await Epiage.find({'tel':epiageuser.tel},{epiage:1,date:1})).sort(function(obj1,obj2){
                            return (new Date(obj1.date)).getTime()- (new Date(obj2.date)).getTime()
                        }).map((ele,index)=>{   
                            return ele.epiage//返回的是[ 23, 55 ]
                            // console.info(ele.epiage)
                        }).filter(function(item) {
                            return item != 0//返回不含0的数组
                        });
                    epiageuser.epiagebox =epiagebox
                    epiageuser.idCard = epiageuser.idCard
                    // epiageuser.idxSexStart =epiageuser.idCard? epiageuser.idCard.length == 18 ? 16 : 14 : "未填写"; 
                    // epiageuser.idxSex = epiageuser.idCard?1 - epiageuser.idCard.substr(epiageuser.idxSexStart, 1) % 2:"未填写";
                    if(epiageuser.idCard){
                        epiageuser.idxSexStart=epiageuser.idCard.length == 18 ? 16 : 14;
                        epiageuser.idxSex=epiageuser.idCard.substr(epiageuser.idxSexStart, 1) % 2
                        epiageuser.sex = epiageuser.idCard? (epiageuser.idxSex == 1 ? '女' : '男'):(epiageuser.sex==1?'女':'男');

                    }else{ epiageuser.idxSex =-1}
                    epiageuser.curAge =epiageuser.idCard? new Date().getFullYear() - parseInt(epiageuser.idCard.substr(6, 4)):"未填写"
                    epiageuser.idCard = epiageuser.idCard? epiageuser.idCard.substr(0, 6) + "*************": "未填写";
                    epiageuser.chroage = epiage.chroage?epiage.chroage: epiageuser.curAge
                    epiageuser.epiage = epiage.epiage
                    epiageuser.accuracy = epiage.accuracy
                    epiageuser.retestdate = new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 180).format("yyyy-MM-dd")
                    console.info(epiageuser.epiagebox)
                    console.info("************")
                    epiageuser.pdfcreated = epiage.pdfbuildate?epiage.pdfbuildate:"未填写"
                    epiage.reportPage = await  fs.promises.readFile(__dirname  +  '/views/back/pdfhtml/epiagereport.html',  'utf-8')
                    let html = epiage.reportPage.replace(/#username/, epiageuser.username)
                        .replace(/#epiagebox/, epiageuser.epiagebox)
                        .replace(/#chroage/, epiageuser.chroage)
                        .replace(/#epiage/, epiageuser.epiage)
                        .replace(/#accuracy/, epiageuser.accuracy)
                        .replace(/#sampleid/, epiageuser.sampleid)
                        .replace(/#idCard/, epiageuser.idCard)
                        .replace(/#created/g, epiage.date)//样本采样时间
                        .replace(/#retestdate/, epiageuser.retestdate)
                        .replace(/#sex/, epiageuser.sex)
                        .replace(/#curAge/, epiageuser.curAge)
                        .replace(/#pdfcreated/, epiageuser.pdfcreated)
                        // console.info(html)
                        if(buildpdf=="build"){
                            let dvalue = html.replace(/height:400px;width: 600px;margin-top:-110px;margin-left:-30px;/, "height:600px;width: 950px;margin-top: 200px;margin-left: 50px;").replace(/fontWeight:500,fontSize:14/g,"fontWeight:700,fontSize:20")
                            res.send(dvalue)
                        }else{
                            res.send(html)
                        }
                    })()
                }
            })
            //如果没值返回页面
    })
})

// app.get("/admin/epiage/report", (req, res) => {
//     (async() => {
//         let id = req.query.id //根据样本id查询到那条记录，然后根据这个ID 查询数据返回htmlpage给浏览器显示
//         let result = await Epiage.findOne({ _id: id })
//         if (result && result.hasOwnProperty("reportPage")) { // true false 0 1 undefind=false 有值=true 
//             let html = result.reportPage
//                 //et dvalue = html.replace("/range1tu[0-5]{1}/g", "range1tu<%=data.dnaval%>").replace(/scroe:[0-5]{1}/,"range1tu<%=data.dnaval%>")
//                 //res.render(dvalue, { "data": result })//render如何把字符串输出到页面
//             res.send(html)
//         } else {
//             let ntrGtBioUsers = JSON.stringify(await Epiage.find({ "$where": "this.chroage > this.epiage" }).select('chroage epiage'));
//             let ntrLtBioUsers = JSON.stringify(await Epiage.find({ "$where": "this.chroage < this.epiage" }).select('chroage epiage'));
//             // let ddd = JSON.stringify(await Epiage.find({ "$where": "this.chroage > this.epiage" }).select('chroage epiage'));
//             console.info(ntrGtBioUsers + "------->" + ntrLtBioUsers)
//                 // console.info()
//             res.render("reportEpiage", { "data": result, "expectedChro": Math.abs((parseFloat(result.epiage - 8.9657)).toFixed(2)), "ntrLtBioUsers": ntrLtBioUsers, "ntrGtBioUsers": ntrGtBioUsers })
//         }
//     })();
//req.query获取的是通过链接地址传递过来的数据
// let id = req.query.id//根据样本id查询到那条记录，然后根据这个ID 查询数据返回htmlpage给浏览器显示
// Epiage.find({ _id: id }, function (err, result) {
//   if (err) console.info(err)
//   //如果result.reportPage没有值返回undefined，但result.reportPage有值返回已经保存的页面
//   //!result.reportPage表示result.reportPage有值，返回数据库中的页面
//   if (result && result.hasOwnProperty("reportPage")) { // true false 0 1 undefind=false 有值=true 
//     let html = result.reportPage
//     //et dvalue = html.replace("/range1tu[0-5]{1}/g", "range1tu<%=data.dnaval%>").replace(/scroe:[0-5]{1}/,"range1tu<%=data.dnaval%>")
//     //res.render(dvalue, { "data": result })//render如何把字符串输出到页面
//     res.send(html)
//   } else {
//     //如果没值返回页面
//     //查询mongodb数据库naturally > biological and biological > 0 
//     var ntrLtBioData = []
//     // var ntrGtBioData = []
//     Epiage.find({ chroage: { $gt: result.epiage } }, function (err, v1) {

//       Epiage.find({ chroage: { $gt: result.epiage } }, function (err, v2) {

//       })
//       console.info(result)
//     })
//     res.render('reportEpiage', { "data": result, "expectedChro": Math.abs((parseFloat(result.epiage - 8.9657)).toFixed(2)) })
//   }
// })
// })

/* app.post("/admin/liver/user/pagination", (req, res) => {
    let index = parseInt(req.body.current) - 1
    let vdata = {}
    Liveruser.findOne(vdata, function(err, liverusers) {
        res.send(liverusers)
    }).sort({ "_id": -1 }).skip(50 * index).limit(50)

}) */
app.post("/admin/user/pagination", (req, res) => {

    let index = parseInt(req.body.current) - 1
       Liver.find().sort({ "_id": -1 }).skip(50 * index).limit(50).exec(function(error, users) {
           if(error) console.info(error)
           else {
       //    console.info(livers.length)
               res.send(users)
              
           }
       })
   })
//肝癌报告页面分页
app.post("/admin/liver/pagenation", (req, res) => {

 let index = parseInt(req.body.current) - 1
  Liver.find({},{sampleid:1,pdf:1,tel:1,mval:1,chance:1,date:1,recdate:1,status:1,issms:1}).sort({ "_id": -1 }).skip(50 * index).limit(50).exec(function(error, livers) {
        if(error) console.info(error)
        else {
	//    console.info(livers.length)
            res.send(livers)
        }
    })
})
//生物学年龄报告页面分页
app.post("/admin/epiage/pagenation", (req, res) => {

    let index = parseInt(req.body.current) - 1
     Epiage.find({},{sampleid:1,pdf:1,tel:1,epiage:1,chroage:1,accuracy:1, date:1,recdate:1,status:1,issms:1}).sort({ "_id": -1 }).skip(50 * index).limit(50).exec(function(error, epiages) {
           if(error) console.info(error)
           else {
               res.send(epiages)
           }
       })
   })
//肝癌用户页面分页
// app.post("/admin/liver/user/pagination", (req, res) => {
//     let index = parseInt(req.body.current) - 1
//     console.info(req.body.current)
//        Liveruser.find().sort({ "_id": -1 }).skip(50 * index).limit(50).exec(function(error, liverusers) {
//            if(error) console.info(error)
//            else {
//               console.info(index)
//                res.send(liverusers)
//                console.info(liverusers)
//            }
//        })
//     }); 
//宫颈癌报告页面分页
app.post("/admin/hpv/pagenation", (req, res) => {
    let index = parseInt(req.body.current) - 1
       Hpv.find({},{sampleid:1,pdf:1,tel:1,mval:1,chance:1,date:1,recdate:1,status:1,issms:1}).sort({ "_id": -1 }).skip(50 * index).limit(50).exec(function(error, livers) {
           if(error) console.info(error)
           else {
          console.info(index)
          console.info(hpvs.length)
               res.send(hpvs)
           }
       });
   })
//泛癌后台库存页面分页
app.post("/admin/genetic/lib/pagenation", (req, res) => {
    let index = parseInt(req.body.current) - 1
    GeneticLib.find().sort({ "_id": -1 }).skip(50 * index).limit(50).exec(function(error, genericlibs) {
        if(error) console.info(error)
        else {
            res.send(genericlibs)
        }
    })
})
//肝癌后台库存页面分页
app.post("/admin/liver/lib/pagenation", (req, res) => {
        let index = parseInt(req.body.current) - 1
        LiverLib.find().sort({ "_id": -1 }).skip(50 * index).limit(50).exec(function(error, liverlibs) {
            if(error) console.info(error)
            else {
                res.send(liverlibs)
            }
        })
    })
    //宫颈癌后台库存页面分页
app.post("/admin/hpv/lib/pagenation", (req, res) => {
    let index = parseInt(req.body.current) - 1

    Hpv.find({}, function(err, result) {
        
            res.send(result) //把数据传递给客户端页面
            
        }).sort({ "_id": -1 }).skip(50 * index).limit(50) 
})
    //生物学年龄用户页面分页
app.post("/admin/epiage/user/pagination", (req, res) => {

        let index = parseInt(req.body.current) - 1
        let vdata = {}
        User.findOne(vdata, function(err, result) {
            console.info(result.length)
            res.send(result) //把数据传递给客户端页面
        }).sort({ "_id": -1 }).skip(50 * index).limit(50)
    })
    //生物学年龄报告页面分页
app.post("/admin/paginationEpiage", (req, res) => {

        let index = parseInt(req.body.current) - 1
        let vdata = {}
        Epiage.findOne(vdata, function(err, result) {
            res.send(result) //把数据传递给客户端页面
        }).sort({ "_id": -1 }).skip(50 * index).limit(50)
    })
    //生物学年龄库存页面分页
app.post("/admin/epiage/lib/pagenation", (req, res) => {
        let index = parseInt(req.body.current) - 1
        EpiageLib.find().sort({ "_id": -1 }).skip(50 * index).limit(50).exec(function(error, agelibs) {
            if(error) console.info(error)
            else {
                res.send(agelibs)
            }
        })
    })
    //肝癌后台生成pdf报告
    // app.post("/admin/buildliverpdf", (req, res) => {
    //   let id = req.body.id//根据样本id查询到那条记录，然后根据这个ID 查询数据返回htmlpage给浏览器显示
    //   console.log(req.body.sampleid)
    //   wkhtmltopdf.command = __dirname + "\\wkhtmltopdf.exe --javascript-delay 20000"
    //   //wkhtmltopdf('https://bainuo.bejingepidial.com/admin/reportliver?id=' + id, { output: __dirname+'/public/pdffile/xx.pdf'});

//   Liver.findOne({ "_id": id }, function (err, result) {
//     console.info(result.sampleid)
//     if (err) { console.info(err) }
//     else if (result && result.reportPage){// true false 0 1 undefind=false 有值=true
//       let html = result.reportPage
//       var spath = __dirname + '/public/pdffile/' + result.sampleid + '.pdf'
//       wkhtmltopdf(html.replace(/block/g, "none"), { output: spath })
//       // result.pdf=result.sampleid + '.pdf'
//       Liver.update({ "_id": id }, { $set: { pdf: result.sampleid + '.pdf' } }, function (err, status) {
//         if (err) console.info(err)
//         console.log(status)
//         res.send("success")
//       })
//     }
//   })
// })

app.get("/admin/epiage/html", (req, res) => {

    let id = req.query.id
    Epiage.findOne({ "_id": id }, function(err, result) {
        if (err) { console.info(err) } else if (result && result.reportPage) {
            let html = result.reportPage.replace(/margin-left:\s*0%;/g, "margin-left:20%;").replace(/margin-top:\s*0px;/g, "margin-top:190px;").replace(/#1a88c7/g, "white")
                // x.log(html);
            res.send(html);
            // res.send(html)
        }
    })
})

    
//肝癌知情同意签名
app.get('/indexLiver', (req, res) => {
        var url = req.originalUrl
        console.log("index URL:" + url)
        res.render('indexLiver')
    })
    //生物学年龄预约同意书
app.get('/indexEpiage', (req, res) => {
        var url = req.originalUrl
        console.log("index URL:" + url)
        res.render('indexEpiage')
    })
        //泛癌检测客户信息信息收集app.all接受get跟post请求,后台直接添加用户报告
app.all('/admin/generic/add/user/report', (req, res) => {
    res.render('back/member-generic-user-form')
})
    //肝癌检测客户信息信息收集app.all接受get跟post请求,后台直接添加用户报告
app.all('/admin/liver/add/user/report', (req, res) => {
    res.render('back/member-liver-user-form')
})
    //宫颈癌检测客户信息信息收集app.all接受get跟post请求,后台直接添加用户报告
    app.all('/admin/hpv/add/user/report', (req, res) => {
        res.render('back/member-hpv-user-form')
    })
    //生物学年龄检测客户信息信息收集app.all接受get跟post请求,后台直接添加用户报告
    app.all('/admin/epiage/add/user/report', (req, res) => {
        res.render('back/member-epiage-user-form')
    })
    //泛癌后台核验单页面
app.get('/admin/generic/check/review', (req, res) => {
    res.render('back/genericuser-upload-report-view')
    // LiverReview.countDocuments({}, (err, count) => {
    //     LiverReview.find({}, function(err, liverReview) {
    //         //判断result是否是undefined
    //         res.render('back/liveruser-upload-report-view', { "data": liverReview ? liverReview : [], "count": count }) //把数据传递给客户端页面
    //     }).sort({ "sampleid": 1}).skip(0).limit(50)
    // })

})
//肝癌后台核验单页面
app.get('/admin/liver/check/review', (req, res) => {
    res.render('back/liveruser-upload-report-view')
    // LiverReview.countDocuments({}, (err, count) => {
    //     LiverReview.find({}, function(err, liverReview) {
    //         //判断result是否是undefined
    //         res.render('back/liveruser-upload-report-view', { "data": liverReview ? liverReview : [], "count": count }) //把数据传递给客户端页面
    //     }).sort({ "sampleid": 1}).skip(0).limit(50)
    // })

})
//生物学年龄后台核验单页面
app.get('/admin/epiage/check/review', (req, res) => {
    res.render('back/epiage-upload-report-view')

})
//宫颈癌癌后台核验单页面
app.get('/admin/hpv/check/review', (req, res) => {
    res.render('back/liveruser-upload-report-view')
})

//肝癌后台核验单核验单表格分页
app.post('/admin/liver/check/datagrid/review', (req, res) => {
    let page = parseInt(req.body.page)-1;//page当前页
    let row = parseInt(req.body.rows);//页面最多几条
    LiverReview.countDocuments({}, (err, total) => {
        LiverReview.find({}, (err, rows) => {
            if (err) console.info(err)

            let data = {}
            data.total = total
            data.rows = rows 
            res.json(data)
            // console.info(data)
           
        }).sort({ "_id": -1 }).skip(row * page).limit(row)
    })
})
//生物学年龄后台核验单核验单表格分页
app.post('/admin/epiage/check/datagrid/review', (req, res) => {
    let page = parseInt(req.body.page)-1;//page当前页
    let row = parseInt(req.body.rows);//页面最多几条
    EpiageReview.countDocuments({}, (err, total) => {
        EpiageReview.find({}, (err, rows) => {
            if (err) console.info(err)

            let data = {}
            data.total = total
            data.rows = rows 
            res.json(data)
            // console.info(data)
           
        }).sort({ "_id": -1 }).skip(row * page).limit(row)
    })
})
//宫颈癌癌后台核验单核验单表格分页
app.post('/admin/hpv/check/datagrid/review', (req, res) => {
    let page = parseInt(req.body.page)-1;//page当前页
    let row = parseInt(req.body.rows);//页面最多几条
    HpvReview.countDocuments({}, (err, total) => {
        HpvReview.find({}, (err, rows) => {
            if (err) console.info(err)

            let data = {}
            data.total = total
            data.rows = rows 
            res.json(data)
            // console.info(data)
           
        }).sort({ "_id": -1 }).skip(row * page).limit(row)
    })
})





//生物学年零检测客户信息信息收集app.all接受get跟post请求
app.all('/admin/epiage/userdata', (req, res) => {

        //微信验证信息 
        //获取上一个页面链接传过来的openid
        console.info("dee--" + req.query.id)
        Epiage.findOne({ _id: req.query.id }, function(err, result) {
                if (err) console.info(err)
                if (result && result.length != 0) {
                    var html = result.htmlpage.replace(/readonly="readonly"/g, "").replace(/display: none;/g, "display: block;")
                    res.send(html)
                } else {
                    res.render('userFormEpiage')

                }
            })
            //根据openid数据库,如果没有这条记录返回userFrom
            //如果有这条记录返回存储在数据库的HTML页面

    })


app.get('/reserveLiver', (req, res) => res.render('reserveLiver'))
app.get('/reserveCervix', (req, res) => res.render('reserveCervix'))
app.get('/maintaining', (req, res) => res.render('maintaining'))
app.get('/reserveEpiage', (req, res) => res.render('reserveEpiage'))
app.get('/checkLiverReport', (req, res) => res.render('checkLiverReport'))
app.get('/reportLiver', (req, res) => res.render('reportLiver'))
app.get('/reportLiver2', (req, res) => res.render('reportLiver2'))

app.get('/admin/liver/reservesuccess', (req, res) => res.render('reserveLiver_success'))
app.get('/admin/epiage/reservesuccess', (req, res) => res.render('reserveEpiage_success'))
    //接受知情同意书签名页面的数据（肝癌，生物学年龄用户）
app.post("/users", function(req, res) {
        new User(req.body).save((err, data) => {
            if (err) console.info(err)
            res.send("success")

        })

    })
    //接收肝癌筛查客户端保信息收集页面数据并返回状态
app.post("/admin/liver/saveuserform", function(req, res) {
    new Liver(req.body).save((err, data) => {
        if (err) console.info(err)
        else {
            console.info(data)
            res.send("success");
        }

    })

});


//接收生物学年龄客户端用户注册信息并返回状态
app.post("/admin/epiage/adduser", function(req, res) {
    console.info("/admin/epiage/adduser:" + req.body)
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

//接收生物学年龄客户端保信息收集页面数据并返回状态
app.post("/admin/epiage/saveform", function(req, res) {
    console.info(req.body)
        //保存生物学年龄的用户数据表到saveformEpiage数据
    new Epiage(req.body).save((err, data) => {
        if (err) console.info(err)
        res.send("success");
    })

});
//泛癌后台添加一个报告，点击提交需要获取并保存的数据
app.post("/admin/generic/addreport", function(req, res) { 
    (async()   =>   {
        let dbgenericlib=await GenericLib.findOne({ sampleid : req.body.sampleid })
        if (!dbgenericlib) {
            await res.send("fail-store-unexist")
        } else if (!await Generic.findOne({ sampleid : req.body.sampleid })) {
            let  generic =   {}
            generic.username =  req.body.username
            generic.sampleid  =  req.body.sampleid                
            generic.mval  =  req.body.mval                
            generic.chance  =  req.body.chance                
            generic.status  =  req.body.status
            generic.recdate = req.body.recdate
            generic.tel = req.body.tel
            generic.date = req.body.created //采集日期
                // liver.date =  new  Date().toLocaleDateString()
                //liver.reportPage  =  await  fs.promises.readFile(__dirname  +  '/views/back/pdfhtml/liverreport.html',  'utf-8')  
            let genericuser = {}
            genericuser.username = req.body.username
            genericuser.tel = req.body.tel
            genericuser.sampleid  =  req.body.sampleid
            genericuser.created =  req.body.created
            genericuser.sex = parseInt(req.body.sex)
            genericuser.age = req.body.age
            genericuser.post=dbgenericlib.post
            await GenericLib.deleteOne({ sampleid: req.body.sampleid })
            await new  Genericuser(genericuser).save()
            await new  Generic(generic).save();
            await res.send("success")
        } else {
            await res.send("fail-report-exist")
        }
    })()
});
//肝癌筛查客户收集信息表单的保存与更新
app.post("/admin/liver/addreport", function(req, res) { 
    (async()   =>   {
        let dbliverlib=await LiverLib.findOne({ sampleid : req.body.sampleid })
        if (!dbliverlib) {
            await res.send("fail-store-unexist")
        } else if (!await Liver.findOne({ sampleid : req.body.sampleid })) {
            let  liver =   {}
            liver.username =  req.body.username
            liver.sampleid  =  req.body.sampleid                
            liver.mval  =  req.body.mval                
            liver.chance  =  req.body.chance                
            liver.status  =  req.body.status
            liver.recdate = req.body.recdate
            liver.tel = req.body.tel
            liver.date = req.body.created //采集日期
                // liver.date =  new  Date().toLocaleDateString()
                //liver.reportPage  =  await  fs.promises.readFile(__dirname  +  '/views/back/pdfhtml/liverreport.html',  'utf-8')  
            let liveruser = {}
            liveruser.username = req.body.username
            liveruser.tel = req.body.tel
            liveruser.sampleid  =  req.body.sampleid
            liveruser.created =  req.body.created
            liveruser.sex = parseInt(req.body.sex)
            liveruser.age = req.body.age
            liveruser.post=dbliverlib.post
            await LiverLib.deleteOne({ sampleid: req.body.sampleid })
            await new  Liveruser(liveruser).save()
            await new  Liver(liver).save();
            await res.send("success")
        } else {
            await res.send("fail-report-exist")
        }
    })()
});
//宫颈癌癌筛查客户收集信息表单的保存与更新
app.post("/admin/hpv/addreport", function(req, res) { 
    (async()   =>   {
        let dbhpvlib=await HpvLib.findOne({ sampleid : req.body.sampleid })
        if (!dbhpvlib) {
            await res.send("fail-store-unexist")
        } else if (!await Hpv.findOne({ sampleid : req.body.sampleid })) {
            let  hpv =   {}
            hpv.username =  req.body.username
            hpv.sampleid  =  req.body.sampleid                
            hpv.mval  =  req.body.mval                
            hpv.chance  =  req.body.chance                
            hpv.status  =  req.body.status
            hpv.recdate = req.body.recdate
            hpv.tel = req.body.tel
            hpv.date = req.body.created //采集日期
                // hpv.date =  new  Date().toLocaleDateString()
                //hpv.reportPage  =  await  fs.promises.readFile(__dirname  +  '/views/back/pdfhtml/liverreport.html',  'utf-8')  
            let hpvuser = {}
            hpvuser.username = req.body.username
            hpvuser.tel = req.body.tel
            hpvuser.sampleid  =  req.body.sampleid
            hpvuser.created =  req.body.created
            hpvuser.sex = parseInt(req.body.sex)
            hpvuser.age = req.body.age
            hpvuser.post=dbhpvlib.post
            await HpvLib.deleteOne({ sampleid: req.body.sampleid })
            await new  Hpvuser(hpvuser).save()
            await new  Hpv(hpv).save();
            await res.send("success")
        } else {
            await res.send("fail-report-exist")
        }
    })()
});
//生物学年龄后台客户收集信息表单的保存与更新
app.post("/admin/epiage/addreport", function(req, res) { 
    (async()   =>   {
        if (!await EpiageLib.findOne({ barcode: req.body.sampleid })) {
            await res.send("fail-store-unexist")
        } else if (!await Epiage.findOne({ sampleid : req.body.sampleid })) {
            let  epiage =   {}
            epiage.username =  req.body.username
            epiage.sampleid  =  req.body.sampleid                
            epiage.epiage =  req.body.epiage
            epiage.chroage=req.body.chroage
            epiage.accuracy =  req.body.accuracy
            epiage.status  =  req.body.status
            epiage.recdate = req.body.recdate
            epiage.tel = req.body.tel
            epiage.date = req.body.created //采集日期
                // epiage.date =  new  Date().toLocaleDateString()
                //epiage.reportPage  =  await  fs.promises.readFile(__dirname  +  '/views/back/pdfhtml/liverreport.html',  'utf-8')  
            let epiageuser = {}
            epiageuser.username = req.body.username
            epiageuser.tel = req.body.tel
            epiageuser.sampleid  =  req.body.sampleid
            epiageuser.created =  req.body.created
            epiageuser.sex = parseInt(req.body.sex)
            epiageuser.age = req.body.epiage
            await EpiageLib.deleteOne({ barcode: req.body.sampleid })
            await new  Epiageuser(epiageuser).save()
            await new  Epiage(epiage).save();
            await res.send("success")
        } else {
            await res.send("fail-report-exist")
        }

    })()

});
//泛癌报告页面批量更新状态
app.post("/admin/generic/changestatus", function(req, res) {
    //setTimeout(function() {
    //批量更新 req.body.idbox是一个数组[1122,12335]
    Generic.updateMany({ '_id': { $in: req.body.idbox } }, { $set: { 'status': req.body.status } }, { multi: true, upsert: false },
            (err, result) => {
                if (err) console.info(err)
                else res.send("success")
            }
        )
        //}, 5000)
});
//肝癌报告页面批量更新状态
app.post("/admin/liver/changestatus", function(req, res) {
    //setTimeout(function() {
    //批量更新 req.body.idbox是一个数组[1122,12335]

    Liver.updateMany({ '_id': { $in: req.body.idbox } }, { $set: { 'status': req.body.status } }, { multi: true, upsert: false },
            (err, result) => {
                if (err) console.info(err)
                else res.send("success")
            }
        )
        //}, 5000)
});
//生物学年龄报告页面批量更新状态
app.post("/admin/epiage/changestatus", function(req, res) {
console.info(req.body.idbox)
    Epiage.updateMany({ '_id': { $in: req.body.idbox } }, { $set: { 'status': req.body.status } }, { multi: true, upsert: false },
            (err, result) => {
                if (err) console.info(err)
                else res.send("success")
            }
        )
});
//肝癌报告页面批量删除
// app.post("/admin/liver/delemass", function(req, res) {
    
//     console.info(req.body.idbox)
//     Liver.deleteMany({ '_id': { $in: req.body.idbox } },
//             (err, result) => {
//                 if (err) console.info(err)
//                 else res.send("success")
//             }
//         )
       

// });
//宫颈癌报告页面批量更新状态
app.post("/admin/hpv/changestatus", function(req, res) {
    //setTimeout(function() {
    //批量更新 req.body.idbox是一个数组[1122,12335]
    Hpv.updateMany({ '_id': { $in: req.body.idbox } }, { $set: { 'status': req.body.status } }, { multi: true, upsert: false },
            (err, result) => {
                if (err) console.info(err)
                else res.send("success")
            }
        )
        //}, 5000)

});
//肝癌查询pdf报告
app.all("/testre", function(req, res) {
    console.info("身份证：" + req.body.identity)
    let identity = req.body.identity;
    Liver.findOne({ identity: identity }, function(err, result) {
        if (result && result.hasOwnProperty("pdf")) {
            var pdf = result.pdf
            console.info(pdf);
            //是在浏览器输出字符串，还是让浏览器跳转
            res.send("pdf");
        } else {
            res.send('error')
        }
    })


})
//泛癌筛查侧边栏点击“用户报告”
app.get("/admin/generic/report/barcodes", (req, res) => {
    Generic.countDocuments({}, (err, count) => {
        Generic.find({}, function(err, generics) {
            //判断result是否是undefined
            res.render('back/member-list-generic', { "data": generics ? generics : [], "count": count }) //把数据传递给客户端页面
        }).sort({ "_id": -1 }).skip(0).limit(50)
    })
})
//肝癌筛查侧边栏点击“用户报告”
app.get("/admin/liver/report/barcodes", (req, res) => {
    Liver.countDocuments({}, (err, count) => {
        Liver.find({}, function(err, livers) {
            //判断result是否是undefined
            res.render('back/member-list-liver', { "data": livers ? livers : [], "count": count }) //把数据传递给客户端页面
        }).sort({ "_id": -1 }).skip(0).limit(50)
    })
    // Liver.findOne({},{sampleid:1,pdf:1,liveruser:1,post:1,username:1}).populate('Liveruser')
    // .exec(function(err, list) {
    //    console.info(list)
    //  });
    //主表Liver关联子表Liveruser查询，sampleid里面为主表外键
    // Liver.find().populate({ 
    //     path: 'sampleid',
    //     select: 'sampleid username post',
    //     model: 'Liveruser'}).exec(function(err,docs){
    //     if (err)console.info(err)
    //      console.info(docs)
    // })
    // Liver.findOne().populate( {path: '_id',select:'_id username',model:'Liveruser'}).exec(function (err, list) {
    // if (err) console.info(err);
    // console.log(list)
    // })
})
//宫颈癌筛查侧边栏点击“用户报告”
app.get("/admin/hpv/report/barcodes", (req, res) => {
    //查询数据库数据
    Hpv.countDocuments({}, (err, count) => {
        Hpv.find({}, function(err, hpv) {
            //判断result是否是undefined
            res.render('back/member-list-hpv', { "data": hpv ? hpv : [], "count": count })
        }).sort({ "_id": -1 }).skip(0).limit(50)
    })


})
//生物学年龄检测左边栏，点击查询Epiage数据库并返回生物学年龄的数据
app.get("/admin/epiage/report/barcodes", (req, res) => {
    //查询数据库数据
    Epiage.countDocuments({}, (err, count) => {
        Epiage.find({}, function(err, result) {
            res.render('back/member-list-epiage', { "data": result, "count": count }) //把数据传递给客户端页面
        }).sort({ "_id": -1 }).skip(0).limit(50)
    })


})

//生物学年龄左边栏点击去数据库EpiageLib查询并展现barcode库存
app.get("/admin/epiage/lib/barcodes", (req, res) => {
        //查询Epiage数据库数据,显示所有barcode
        EpiageLib.countDocuments({}, (err, count) => {
            EpiageLib.find({}, function(err, result) {
                res.render('back/member-list-agelib', { "data": result, "count": count }) //把数据传递给客户端页面
            }).sort({ "_id": -1 }).skip(0).limit(50)
        })


    })
    //生物学年龄左边栏点击去数据库EpiageUser查询所有用户并展现到页面
app.get("/admin/user/users", (req, res) => {
    //查询Epiage数据库数据,显示所有barcode
    let vdata = {}
    User.find(vdata, function(err, result) {
        res.render('back/member-list-users', { "data": result, "count": result.length }) //把数据传递给客户端页面
    }).sort({ "_id": -1 }).skip(0).limit(50)

})

// 生物学年龄文件上传接口
app.post('/admin/epiage/uploadcvs', function(req, res) {
    // 上传的文件在req.files中
    const filename = req.files[0].path + path.parse(req.files[0].originalname).ext
    fs.rename(req.files[0].path, filename, function(err) {
        if (err) {
            res.send(err)
        } else {
            //从上传成功的文件里读取文件数据
            let stream = readline.createInterface({ input: fs.createReadStream(filename) })
            stream.on('line', (line) => {
                let data = {}
                data.name = "DNA Methylation Kit"
                data.barcode = line
                data.createtime = new Date().toLocaleDateString()
                data.status = "NO_STATUS"
                console.info(data)
                    //把异步变同步方便处理数据
                EpiageLib.findOne({ "barcode": line }, (err, rsdata) => {
                    if (err) console.info(err)
                    if (!rsdata) {
                        new EpiageLib(data).save((err) => {
                            if (err) console.info(err)
                        })
                    }
                })
            })
            stream.on('close', (err) => {
                if (err) console.info(err)
                res.redirect("/admin/epiage/inventory")
            });

        }
    })
})
app.get("/admin/epiage/inventory", (req, res) => {
    let vdata = {}
    EpiageLib.find(vdata, function(err, result) {
        // console.info(result.length)
        res.render('back/member-list-agelib', { "data": result, "count": result.length }) //把数据传递给客户端页面
    }).sort({ "_id": -1 }).skip(0).limit(50)

})

//生物学年龄库存页面，点击添加cvs到数据库添加库存
// app.all("/admin/epiage/uploadcvs", (req, res) => {
//   console.info("-------------------")
//   console.info(req.body)
//   //查询数据库数据
//   // let vdata = {}
//   // Epiage.find(vdata, function (err, result) {
//   //   res.render('back/member-list-epiage', { "data": result, "count": result.length }) //把数据传递给客户端页面
//   // }).sort({ "_id": -1 }).skip(0).limit(50)

// })
//肝癌筛查左边下拉栏
app.get("/admin/member-show", (req, res) => {
        let id = req.query.id
            //查询数据库数据
        Liver.findOne({ _id: id }, function(err, result) {
            // res.render('back/member-list', { "data": result }) //把数据传递给客户端页面
        })
    })
    //生物学年龄检测左边下拉栏
app.get("/admin/member-show", (req, res) => {
        let id = req.query.id
            //查询数据库数据
        Liver.findOne({ _id: id }, function(err, result) {
            // res.render('back/member-list', { "data": result }) //把数据传递给客户端页面
        })
    })
    //肝癌报告查询
app.post("/admin/liver/saveReport", (req, res) => {

        //根据客户端传来的id查询并更新、插入对应数据
        // console.log("这是报告里面的id??" + req.body.id)
        Liver.findOne({ _id: req.body.id }, function(err, result) {
            if (err) console.info(err)
            result.sampleid = req.body.sampleid
            result.reportPage = req.body.reportPage
            result.dnaval = req.body.dnaval
            console.info("saveReport:");
            Liver.updateOne({ _id: req.body.id }, { $set: { "sampleid": result.sampleid, "reportPage": result.reportPage, "dnaval": result.dnaval, "status": "Completed" } }, function(err, status) {
                if (err) console.info(err)
                res.send("success")
            })
        })
    })
    //生物学年龄报告查询

app.post("/admin/epiage/savereport", (req, res) => {
        //根据客户端传来的id查询并更新、插入对应数据
        console.log("这是报告里面的id??" + req.body.id)
        Epiage.findOne({ _id: req.body.id }, function(err, result) {
            if (err) console.info(err)
            let parm = {}
            parm.sampleid = req.body.sampleid
            parm.chroage = req.body.chroage
            parm.epiage = req.body.epiage
            parm.reportPage = req.body.reportPage
            parm.accuracy = req.body.accuracy
            parm.dnaval = req.body.dnaval
                // let parm= { "sampleid": sampleid, "chroage":  chroage, "epiage":  epiage, "accuracy": accuracy, "reportPage":reportPage, "dnaval": dnaval } 
            console.info(result.chroage + "---------------- " + req.body.epiage);
            Epiage.update({ _id: req.body.id }, { $set: parm }, function(err, status) {
                if (err) console.info(err)
                res.send("success")
            })
        })
    })
     //肝癌报告输入结果后更新报告
app.post("/admin/generic/updateform", (req, res) => {
    console.info(req.body.sampleid)
        //后台录入sampleid时只能是唯一的sampleid，不能重复，
    Generic.findOne({ sampleid: req.body.sampleid }, function(err, result) {
        if (err) console.info(err)
            //如果result没有值（！result）就更新，
        if (!result) {
            //根据客户端传来的id查询并更新、插入对应数据
            // result.sampleid = req.body.sampleid
            Generic.updateOne({ _id: req.body.id }, { $set: { "sampleid": req.body.sampleid } }, function(err, status) {
                if (err) console.info(err)
                console.log(status)
                res.send("success")
            })
        } else {
            res.send("error")
        }

    })
})
    //肝癌报告输入结果后更新报告
app.post("/admin/liver/updateform", (req, res) => {
        console.info(req.body.sampleid)
            //后台录入sampleid时只能是唯一的sampleid，不能重复，
        Liver.findOne({ sampleid: req.body.sampleid }, function(err, result) {
            if (err) console.info(err)
                //如果result没有值（！result）就更新，
            if (!result) {
                //根据客户端传来的id查询并更新、插入对应数据
                // result.sampleid = req.body.sampleid
                Liver.updateOne({ _id: req.body.id }, { $set: { "sampleid": req.body.sampleid } }, function(err, status) {
                    if (err) console.info(err)
                    console.log(status)
                    res.send("success")
                })
            } else {
                res.send("error")
            }

        })
    })
        //宫颈癌报告输入结果后更新报告
app.post("/admin/hpv/updateform", (req, res) => {
    console.info(req.body.sampleid)
        //后台录入sampleid时只能是唯一的sampleid，不能重复，
    Hpv.findOne({ sampleid: req.body.sampleid }, function(err, result) {
        if (err) console.info(err)
            //如果result没有值（！result）就更新，
        if (!result) {
            //根据客户端传来的id查询并更新、插入对应数据
            // result.sampleid = req.body.sampleid
            Hpv.updateOne({ _id: req.body.id }, { $set: { "sampleid": req.body.sampleid } }, function(err, status) {
                if (err) console.info(err)
                console.log(status)
                res.send("success")
            })
        } else {
            res.send("error")
        }

    })
})
    //泛癌报告输入M值与概率更新报告
    app.post("/admin/generic/update", (req, res) => {
        //后台录入sampleid时只能是唯一的sampleid，不能重复，
        Generic.findOne({ _id: req.body.id }, function(err, result) {
            if (err) console.info(err)
                //根据客户端传来的id查询并更新、插入mval,chance的值
                Generic.updateOne({ _id: req.body.id }, { $set: { mval: parseFloat(req.body.mval), chance: parseFloat(req.body.chance),date:req.body.date,recdate:req.body.recdate } }, function(err, status) {
                if (err) console.info(err)
                console.log(status)
                res.send("success")
            })

        })
    })
    //肝癌报告输入M值与概率更新报告
app.post("/admin/liver/update", (req, res) => {
        //后台录入sampleid时只能是唯一的sampleid，不能重复，
        Liver.findOne({ _id: req.body.id }, function(err, result) {
            if (err) console.info(err)
                //根据客户端传来的id查询并更新、插入mval,chance的值
            Liver.updateOne({ _id: req.body.id }, { $set: { mval: parseFloat(req.body.mval), chance: parseFloat(req.body.chance),date:req.body.date,recdate:req.body.recdate } }, function(err, status) {
                if (err) console.info(err)
                console.log(status)
                res.send("success")
            })

        })
    })
    //泛癌后台核验单
app.post("/admin/generic/check/review/update", (req, res) => {
        //后台录入sampleid时只能是唯一的sampleid，不能重复，
        GenericReview.findOne({ _id: req.body.id }, function(err, result) {
            if (err) console.info(err)
                //根据客户端传来的id查询并更新、插入mval,chance的值
                GenericReview.updateOne({ _id: req.body.id }, { $set: { mval: req.body.mval, probability: req.body.probability,sex:req.body.sex,username:req.body.username} }, function(err, status) {
                if (err) console.info(err)
                console.log(status)
                res.send("success")
            })

        })
    })
//肝癌后台核验单数据更新
    app.post("/admin/liver/check/review/update", (req, res) => {
        //后台录入sampleid时只能是唯一的sampleid，不能重复，
        LiverReview.findOne({ _id: req.body.id }, function(err, result) {
            if (err) console.info(err)
                //根据客户端传来的id查询并更新、插入mval,chance的值
                LiverReview.updateOne({ _id: req.body.id }, { $set: { mval: req.body.mval, probability: req.body.probability,sex:req.body.sex,username:req.body.username} }, function(err, status) {
                if (err) console.info(err)
                console.log(status)
                res.send("success")
            })

        })
    })
    //生物学年龄后台核验单数据更新
    app.post("/admin/epiage/check/review/update", (req, res) => {
        //后台录入sampleid时只能是唯一的sampleid，不能重复，
        EpiageReview.findOne({ _id: req.body.id }, function(err, result) {
            if (err) console.info(err)
                //根据客户端传来的id查询并更新、插入mval,chance的值
                EpiageReview.updateOne({ _id: req.body.id }, { $set: { chroage: req.body.chroage, epiage: req.body.epiage,sex:req.body.sex,username:req.body.username,accuracy:req.body.accuracy} }, function(err, status) {
                if (err) console.info(err)
                console.log(status)
                res.send("success")
            })

        })
    })
    //宫颈癌癌后台核验单
    app.post("/admin/hpv/check/review/update", (req, res) => {
        //后台录入sampleid时只能是唯一的sampleid，不能重复，
        HpvReview.findOne({ _id: req.body.id }, function(err, result) {
            if (err) console.info(err)
                //根据客户端传来的id查询并更新、插入mval,chance的值
                HpvReview.updateOne({ _id: req.body.id }, { $set: { mval: req.body.mval, probability: req.body.probability,sex:req.body.sex,username:req.body.username} }, function(err, status) {
                if (err) console.info(err)
                console.log(status)
                res.send("success")
            })

        })
    })
        //生物学年龄报告输入更新报告
app.post("/admin/epiage/update", (req, res) => {
    //后台录入sampleid时只能是唯一的sampleid，不能重复，
    console.info(req.body)
    let setting={}
    if (req.body.chroage) {
        setting.chroage = parseFloat(req.body.chroage)
    }
    if (req.body.epiage) {
        setting.epiage = parseFloat(req.body.epiage)
    }
    if (req.body.accuracy) {
        setting.accuracy = parseFloat(req.body.accuracy)
    }
    if (req.body.date) {
        setting.date=req.body.date
    }
    if (req.body.recdate) {
        setting.recdate=req.body.recdate
    }
    Epiage.findOne({ _id: req.body.id }, function(err, result) {
        if (err) console.info(err)
            if(req.body.epiage){
                Epiage.updateOne({ _id: req.body.id }, { $set: setting}, function(err, status) {
                    if (err) console.info(err) 
                    Epiageuser.updateOne({ sampleid: req.body.sampleid }, { $set: {age:req.body.epiage}}, function(err, status) {
                        console.log(status)
                    res.send("success")
                    })
                    
                }) 
            }else{
                Epiage.updateOne({ _id: req.body.id }, { $set: setting}, function(err, status) {
                    if (err) console.info(err) 
                    console.log(status)
                    res.send("success")
                })
               
            }
          
    })
})
        //宫颈癌报告输入M值与概率更新报告
app.post("/admin/hpv/update", (req, res) => {
    //后台录入sampleid时只能是唯一的sampleid，不能重复，
    Hpv.findOne({ _id: req.body.id }, function(err, result) {
        if (err) console.info(err)
            //根据客户端传来的id查询并更新、插入mval,chance的值
            Hpv.updateOne({ _id: req.body.id }, { $set: { mval: req.body.mval, chance: req.body.chance } }, function(err, status) {
            if (err) console.info(err)
            console.log(status)
            res.send("success")
        })

    })
})
    //生物学年龄报告输入结果后更新报告
app.post("/admin/epiage/updateform", (req, res) => {
        //1.输入sampleid时查询数据库是否有相同的smaplid，如果有就提示不能使用相同sampleid
        //2.如果没有就保存输入的sampleid到Livers的数据库对应客户信息表里。
        Epiage.findOne({ sampleid: req.body.sampleid }, function(err, result) {
            console.info("这是报告页面输入的sampleid" + req.body.sampleid)
            if (err) console.info(err)

            if (!result) {
                //根据客户端传来的id查询并更新、插入对应数据
                // result.sampleid = req.body.sampleid
                Epiage.updateOne({ _id: req.body.id }, { $set: { "sampleid": req.body.sampleid } }, function(err, status) {
                    if (err) console.info(err)
                    console.log(status)
                    res.send("success")

                })
            } else {
                res.send("error")
            }

        })
    })


//肝癌删除数据库一行
app.post("/admin/delete", (req, res) => {
        console.log("删除id是： " + req.body.id)
        Liver.deleteOne({ _id: req.body.id }, function(err, data) {
            if (err) console.info(err)
            res.send("success")

        })
    })
    //生物学年龄用户删除数据库一行
app.post("/admin/epiage/deleteuser", (req, res) => {
        console.log("删除的生物学年龄用户id是： " + req.body.id)
        Epiageuser.deleteOne({ _id: req.body.id }, function(err, data) {
            if (err) console.info(err)
            res.send("success")

        })
    })
    //生物学年龄删除数据库一行
app.post("/admin/epiage/deletereport", (req, res) => {
        console.log("删除的报告id是： " + req.body.id)
        Epiage.deleteOne({ _id: req.body.id }, function(err, data) {
            if (err) console.info(err)
            res.send("success")

        })
    })
    //生物学年龄库存删除一条数据
app.post("/admin/epiage/deletelab", (req, res) => {
        console.log("删除的id是： " + req.body.id)
        EpiageLib.deleteOne({ _id: req.body.id }, function(err, data) {
            if (err) console.info(err)
            res.send("success")

        })
    })
    //肝癌查看用户填写信息页面
app.get("/admin/detail", (req, res) => {
        //req.query获取的是通过链接地址传递过来的数据
        // let htmlpage=req.query.htmlpage//("<html>"+req.body.htmlpage+"</html>")
        let id = req.query.id //根据样本id查询到那条记录，然后根据这个ID 查询数据返回htmlpage给浏览器显示
        Liver.findOne({ _id: id }, function(err, result) {
            if (err) { console.info(err) } else if (result && result.hasOwnProperty("htmlpage")) {
                //result返回的是当前id获取到的哪一行的数据
                // console.info(result)
                var htmlpage = result.htmlpage
                res.send(htmlpage)
            }
        })
    })
    //后台查看生物学年龄用户填写信息页面

app.get("/admin/detailEpiage", (req, res) => {
    //req.query获取的是通过链接地址传递过来的数据
    // let htmlpage=req.query.htmlpage//("<html>"+req.body.htmlpage+"</html>")
    //根据样本id查询到那条记录，然后根据这个ID 查询数据返回htmlpage给浏览器显示
    let id = req.query.id
    Epiage.findOne({ _id: id }, function(err, result) {
        if (err) { console.info(err) }
        //判断Epiage数据库是否已经有"htmlpage"这条数据，有就展现到页面
        else if (result && result.htmlpage) {
            //result返回的是当前id获取到的哪一行的数据
            var htmlpage = result.htmlpage
            res.send(htmlpage)
        }
    })
})
app.get('/admin/eipage/detailEpiage', (req, res) => {
    let data = {}
    data.sampleid = req.query.sampleid
    Epiageuser.findOne(data, function(err, epiageuser) {
        console.info(epiageuser)
        res.render('back/epiageuserdetail', { "Epiageuser": epiageuser }) //把数据传递给客户端页面
    })
})
module.exports = app;

