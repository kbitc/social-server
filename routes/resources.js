const express = require('express');
const bodyParser = require('body-parser');
var winston = require('winston');

var logger = winston.loggers.get('resources');
var router = express.Router();
var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: true });

router.get('/', function (req, res) {
    logger.info('Request to retrieve resources');
    res.status(200).send([]);
});

module.exports = router;