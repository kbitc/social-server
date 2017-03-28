const express = require('express');
var router = express.Router();

router.use('/markers', require('./markers'));

module.exports = router;