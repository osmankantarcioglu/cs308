var express = require('express');
var router = express.Router();

//we are goint to write our endpoints here

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
