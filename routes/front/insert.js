// insert.js file
let mongoose = require('mongoose');

// 导入连接模块
let connection = require('./app.js');

// 创建schema
let UserSchema = new mongoose.Schema({
    signname: String,
    signdate: String
 })
 
 // 通过connection和schema创建model
 let UsertModel = connection.model('User', UserSchema);
 
 
 // 通过实例化model创建文档
 let userDoc = new UsertModel({
     name: 'zhangsan',
     age: 20
 })
 
 // 将文档插入到数据库，save方法返回一个Promise对象。
 userDoc.save().then((doc) => {
     console.log(doc)
 })
 
