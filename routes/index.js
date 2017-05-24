const express = require('express');
var cors = require('cors');
var router = express.Router();

// Configure logging
var winston = require('winston');
// Configure the logger for markers
winston.loggers.add('markers', {
    console: {
        colorize: true,
        timestamp: true,
        label: 'Markers'
    },
    file: {
        filename: './logs/markers.log',
        options: {
            flags: 'w'
        }
    }
});
// Configure the logger for resources
winston.loggers.add('resources', {
    console: {
        colorize: true,
        timestamp: true,
        label: 'Resources'
    },
    file: {
        filename: './logs/resources.log',
        options: {
            flags: 'w'
        }
    }
});

router.use('/api/markers', cors(), require('./markers'));
router.use('/api/resources', cors(), require('./resources'));

module.exports = router;