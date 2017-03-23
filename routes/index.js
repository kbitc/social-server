const express = require('express');
var router = express.Router();

router.use('/marker', require('./marker'));

module.exports = router;