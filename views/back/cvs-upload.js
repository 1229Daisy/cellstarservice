// 创建上传接口文件upload.js
var createFolder = function(folder){

try{
    fs.accessSync(folder); 
}catch(e){
    fs.mkdirSync(folder);
}  
};
var uploadFolder = './cvs-upload/'; //文件上传位置

createFolder(uploadFolder);
var storage = multer.diskStorage({

destination: function (req, file, cb) {
  cb(null, uploadFolder)
},
filename: function (req, file, cb) {
  cb(null, file.originalname)
}
})
var upload = multer({ storage: storage })

//上传接口
router.post('/upload', upload.single('file'), function(req, res) {

fs.rename(req.file.path, "uploads/" + req.file.originalname, function(err) {
    if (err) {
        throw err;
    }
    var data= req.file
    var photo=req.file.url
    res.send({
        code:CODE_SUCCESS,
        msg:'上传成功',
        data:data
      })
   //添加到数据库
    const query = `insert into sys_data(photo) values( '${photo}')`;
    querySql(query)
    .then(data => {

      res.json({ 
          code: CODE_SUCCESS, 
          msg: '添加数据成功', 
          data: null 
        })
    })
 })
})
module.exports = router