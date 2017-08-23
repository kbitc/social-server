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
// Configure the logger for resources
winston.loggers.add('books', {
    console: {
        colorize: true,
        timestamp: true,
        label: 'Search'
    },
    file: {
        filename: './logs/books.log',
        options: {
            flags: 'w'
        }
    }
});

// Configure the logger for resources
winston.loggers.add('map', {
    console: {
        colorize: true,
        timestamp: true,
        label: 'Map'
    },
    file: {
        filename: './logs/map.log',
        options: {
            flags: 'w'
        }
    }
});

// Configure the logger for resources
winston.loggers.add('stories', {
    console: {
        colorize: true,
        timestamp: true,
        label: 'Stories'
    },
    file: {
        filename: './logs/stories.log',
        options: {
            flags: 'w'
        }
    }
});

router.use('/api/markers', cors(), require('./markers'));
router.use('/api/resources', cors(), require('./resources'));
router.use('/api/books', cors(), require('./books'));
router.use('/api/map', cors(), require('./map'));
router.use('/api/stories', cors(), require('./stories'));

module.exports = router;