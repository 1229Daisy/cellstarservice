var express = require('express');
var router = express.Router();
 
 
router.get('/', function(req, res, next) {
//前面没有 "/"符号
  res.render('index', { title: '知情同意书' });
});
 
module.exports = router