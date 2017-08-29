const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
var Datastore = require('nedb');
var winston = require('winston');
var uuid = require('node-uuid');

var logger = winston.loggers.get('stories');
var router = express.Router();
var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: true });

// Open datastore
var db = new Datastore({
    filename: './data/stories.json',
    autoload: true
});

// Get all stories
router.get('/', function(req, res) {
    logger.info('Request to retrieve stories');
    db.find({}, function (err, docs) {
        if (err) {
            res.status(500).send("Database error");
        }
        else {
            var items = [];
            var offset = (req.query.offset != null ? parseInt(req.query.offset) : 0);
            var limit = (req.query.limit != null ? parseInt(req.query.limit) : docs.length);
            if (offset < docs.length) {
                for (var i = offset, c = Math.min(offset + limit, docs.length); i < c; i++) {
                    items.push(docs[i]);
                }
            }
            res.status(200).send({
                'meta': {
                    'total': docs.length,
                    'offset': offset,
                    'limit': limit
                },
                'items': items
            });
        }
    });
});

// Get specific story
router.get('/:storyId', function(req, res) {
    var storyId = req.params.storyId;
    logger.info('Request to retrieve a story', { id: storyId });
    db.find({ id: storyId }, function (err, docs) {
        if (err) {
            res.status(500).send("Database error");
        }
        else if (docs.length > 0) {
            var story = docs[0];
            res.status(200).send(story);
        }
        else {
            res.status(404).send('Story is not found');
        }
    });
});

// Creation of a whole new story
router.post('/', jsonParser, function (req, res) {
    var storyId = uuid.v4();
    var tsp = new Date().getTime();
    var story = {
        pages: [
            {
                'story': req.body.story,
                'author': req.body.author,
                'timestamp': tsp,
                'votes': 0
            }
        ],
        'author': req.body.author,
        'timestamp': tsp,
        'id': storyId
    };
    db.insert(story, function (error, newDoc) {
        if (error) {
            logger.error('Can not write new story');
            res.status(500).send("Database error");
        }
        else {
            logger.info('Created new story', { id: storyId });
            res.status(200).send({ 
                id: storyId
            });
        }
    });
});

// Submitting a new page to existing story
router.post('/:storyId', jsonParser, function (req, res) {
    var storyId = req.params.storyId;
    logger.info('Request to add new page to story', { id: storyId });
    var tsp = new Date().getTime();
    var story = {
        'story': req.body.story,
        'author': req.body.author,
        'timestamp': tsp,
        'votes': 0
    }
    db.update({ id: storyId }, { $push: { 'pages': story }}, function (error, numReplaced) {
        if (error) {
            res.status(500).send("Database error");
        }
        else if (numReplaced > 0) {
            res.status(200).send('New page has been successfully added');
        }
        else {
            res.status(404).send("Story not found");
        }
    });
})

module.exports = router;