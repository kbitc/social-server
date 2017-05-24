const express = require('express');
var multer  = require('multer')
var winston = require('winston');

// Configure upload
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '/public/resources/')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now())
  }
});
var upload = multer({ 
    storage: storage,
    fileFilter: function(req, file, cb) {
        console.log(file.fieldname);
        console.log(file.mimetype);
        cb(null, true);
    } 
});
var logger = winston.loggers.get('resources');
var router = express.Router();

router.get('/', function (req, res) {
    logger.info('Request to retrieve resources');
    res.status(200).send([]);
});

router.post('/', upload.single('picture'), function(req, res) {
    logger.info('Uploaded file');
    res.status(200).send('Successfully uploaded file');
});

module.exports = router;