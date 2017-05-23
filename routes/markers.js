const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
var cors = require('cors');
var Datastore = require('nedb');
var winston = require('winston');

var router = express.Router();
var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: true });

// Configure logs
winston.add(winston.transports.File, {
    filename: './logs/markers.log',
    options: {
        flags: 'w'
    }
});

// Open datastore
var db = new Datastore({
    filename: './data/markers.json',
    autoload: true
});

router.get('/:markerId', cors(), function (req, res) {
    var markerId = req.params.markerId;
    winston.info('Request to retrieve marker', { id: markerId });
    db.find({ fbId: markerId }, function (err, docs) {
        if (err) {
            res.status(500).send("Database error");
        }
        else if (docs.length > 0) {
            var marker = docs[0];
            res.status(200).send({
                'fbId': marker.fbId,
                'title': marker.title,
                'description': marker.description,
                'location': marker.location,
                'author': marker.author,
                'level': marker.level
            });
        }
        else {
            res.status(404).send('Marker is not found');
        }
    });
});

router.delete('/:markerId', cors(), function (req, res) {
    var markerId = req.params.markerId;
    winston.info('Request to delete marker', { id: markerId });
    db.find({ fbId: markerId }, function (error, docs) {
        if (error) {
            res.status(500).send("Database error");
        }
        else if (docs.length > 0) {
            const url = "https://graph.facebook.com/v2.8/" + markerId + "?access_token=" + process.env.FB_APP_TOKEN;
            axios.delete(url)
                .then(function (response) {
                    if (response.data['success'] == true) {
                        db.remove({ fbId: markerId }, function (err, numRemoved) {
                            if (err) {
                                res.status(500).send("Database error");
                            }
                            else if (numRemoved > 0) {
                                res.status(200).send('Marker has been successfully removed');
                            }
                            else {
                                res.status(410).send('Marker is gone');
                            }
                        });
                    }
                })
                .catch(function (error) {
                    res.status(error.response.status).send(error.response.statusText);
                });
        }
        else {
            res.status(404).send("Resource not found");
        }
    });
});

router.put('/:markerId', cors(), jsonParser, function (req, res) {
    var markerId = req.params.markerId;
    winston.info('Request to update marker', { id: markerId });
    db.update({ fbId: markerId }, { $set: req.body }, function (err, numReplaced) {
        if (err) {
            res.status(500).send("Database error");
        }
        else if (numReplaced > 0) {
            res.status(200).send('Marker has been successfully updated');
        }
        else {
            res.status(404).send('Marker is not found');
        }
    });
});

router.get('/', cors(), function (req, res) {
    var level = req.query.level;
    winston.info('Request to retrieve all markers in area', { area: level });
    db.find({ "level": level }, function (err, docs) {
        if (err) {
            res.status(500).send("Database error");
        }
        else {
            res.status(200).send({
                'items': docs
            });
        }
    });
});

router.post('/', cors(), jsonParser, function (req, res) {
    var url = "https://graph.facebook.com/app/objects/place";
    var payload = {
        access_token: process.env.FB_APP_TOKEN,
        object: {
            "fb:app_id": process.env.FB_APP_ID,
            "og:type": "place",
            "og:url": "http://www.oulu3d.fi/virtual-oulu/",
            "og:title": req.body.title,
            "og:description": req.body.description,
            "og:image": "http://www.oulu3d.fi/wp-content/uploads/2015/02/logo.png",
            "place:location:latitude": "65.015387",
            "place:location:longitude": "25.463297"
        }
    }
    axios.post(url, payload)
        .then(function (response) {
            var objectId = response.data.id;
            winston.info('Created new marker', { id: objectId });
            const marker = {
                fbId: objectId,
                title: req.body.title,
                description: req.body.description,
                location: req.body.location,
                author: req.body.author,
                level: req.body.level
            }
            db.insert(marker, function (error, newDoc) {
                if (error) {
                    res.status(500).send("Database error");
                }
                else res.status(200).send(marker);
            });
        })
        .catch(function (error) {
            winston.error('Facebook raised error');
            res.status(error.response.status).send(error.response.statusText);
        });
});

module.exports = router;