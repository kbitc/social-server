const express = require('express');
const fs = require('fs');
var multer = require('multer')
var winston = require('winston');
var Datastore = require('nedb');

// Configure upload
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/resources/')
    },
    filename: function (req, file, cb) {
        var mimetype = file.mimetype.split('/');
        cb(null, 'res-' + Date.now() + '.' + mimetype[1]);
    }
});
var upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        // mimetype[0] must be type of file, such as image, audio or video
        // mimetype[1] must be format of file
        var mimetype = file.mimetype.split('/');
        if (mimetype[0] == 'image') cb(null, true);
        else cb(null, false);
    }
});
var logger = winston.loggers.get('resources');
var router = express.Router();

// Open datastore
var db = new Datastore({
    filename: './data/resources.json',
    autoload: true
});

router.get('/', function (req, res) {
    logger.info('Request to retrieve resources');
    db.find({}, function (error, docs) {
        if (error) {
            res.status(500).send("Database error");
        }
        else {
            var package = [];
            for (var i = 0; i < docs.length; i++) {
                package.push({
                    url: docs[i].url,
                    filename: docs[i].originalname,
                    res: docs[i].filename,
                    ts: docs[i].timestamp,
                    assigned: docs[i].assigned
                });
            }
            res.status(200).send({ items: package });
        }
    });
});

router.post('/', upload.single('file'), function (req, res) {
    if (req.file) {
        logger.info('Uploaded file', { file: req.file.originalname });
        const PORT = process.env.PORT || 3000;
        const host = req.protocol + '://' + req.hostname + ':' + PORT;
        var fileObject = {
            url: host + '/resources/' + req.file.filename,
            filename: req.file.filename,
            originalname: req.file.originalname,
            timestamp: Date.now(),
            assigned: 0
        }
        db.insert(fileObject, function (error, newDoc) {
            if (error) {
                res.status(500).send("Database error");
            }
            res.status(200).send('Successfully uploaded file');
        });
    }
    else res.status(400).send('File not found');
});

router.get('/:resource', function (req, res) {
    var resource = req.params.resource;
    logger.info('Request to retrieve resource', { file: resource });
    db.find({ filename: resource }, function (error, docs) {
        if (error) {
            res.status(500).send("Database error");
        }
        else if (docs.length > 0) {
            var result = {
                url: docs[0].url,
                filename: docs[0].originalname,
                res: docs[0].filename,
                ts: docs[0].timestamp,
                assigned: docs[0].assigned
            };
            res.status(200).send(result);
        }
        else {
            res.status(404).send("Resource not found");
        }
    });
});

router.delete('/:resource', function (req, res) {
    var resource = req.params.resource;
    logger.info('Request to delete file', { file: resource });
    db.find({ filename: resource }, function (error, docs) {
        if (error) {
            res.status(500).send("Database error");
        }
        else if (docs.length > 0) {
            // Physically remove file
            var file = './public/resources/' + resource;
            fs.unlink(file, function (err) {
                if (err) throw err;
                logger.info('Removed file', { file: resource });
            });
            // Remove record from database
            db.remove({ filename: resource }, function (error, numRemoved) {
                if (error) {
                    res.status(500).send("Database error");
                }
                else {
                    res.status(200).send("Resource has been successfully removed");
                }
            });
        }
        else {
            res.status(404).send("Resource not found");
        }
    })
});

module.exports = router;