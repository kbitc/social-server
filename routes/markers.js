const express = require('express');
const axios = require('axios');
var bodyParser = require('body-parser');
var cors = require('cors');
var Datastore = require('nedb');

var router = express.Router();
var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: true });
var db = new Datastore({
    filename: './data/markers.json',
    autoload: true
});

router.get('/:markerId', cors(), function (req, res) {
    var markerId = req.params.markerId;
    console.log('Request to retrieve marker with id ' + markerId);
    db.find({ fbId: markerId }, function (err, docs) {
        // docs is an array containing documents Mars, Earth, Jupiter
        // If no document is found, docs is equal to []
        if (docs.length > 0) {
            var marker = docs[0];
            res.render('marker', {
                pageTitle: marker.title,
                markerTitle: marker.title,
                markerId: marker.fbId
            });
        }
        else {
            res.status(404).send('Marker is not found');
        }
    });
});

router.delete('/:markerId', cors(), function (req, res) {
    var markerId = req.params.markerId;
    console.log('Request to delete marker with id ' + markerId);
    var url = "https://graph.facebook.com/v2.8/" + markerId + "?access_token=" + process.env.FB_APP_TOKEN;
    axios.delete(url)
        .then(function (response) {
            console.log(response.data);
            if (response.data['success'] == true) {
                db.remove({ fbId: markerId }, function (err, numRemoved) {
                    if (numRemoved > 0) {
                        res.status(200).send('Marker has been successfully removed');
                    }
                    else {
                        res.status(404).send('Marker is not found');
                    }
                });
            }
        })
        .catch(function (error) {
            console.log(error);
            res.status(400).send(error);
        });

});

router.put('/:markerId', cors(), jsonParser, function (req, res) {
    var markerId = req.params.markerId;
    console.log('Request to update marker with id ' + markerId);
    db.update({ fbId: markerId }, { $set: req.body }, function (err, numReplaced) {
        if (numReplaced > 0) {
            res.status(200).send('Marker has been successfully updated');
        }
        else {
            res.status(404).send('Marker is not found');
        }
    });
});

router.get('/:markerId/likes', cors(), function (req, res) {
    var markerId = req.params.markerId;
    var url = "https://graph.facebook.com/v2.8/" + markerId + "/likes?access_token=" + process.env.FB_APP_TOKEN;
    axios.get(url, {})
        .then(function (response) {
            res.send(response.data);
        })
        .catch(function (error) {
            console.log(error);
            res.status(400).send(error);
        });
});

router.get('/', cors(), function (req, res) {
    console.log('Request to retrieve all markers in area');
    db.find({}, function (err, docs) {
        res.status(200).send({
            'items': docs
        });
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
            "og:description": req.body.desc,
            "og:image": "http://www.oulu3d.fi/wp-content/uploads/2015/02/logo.png",
            "place:location:latitude": "65.015387",
            "place:location:longitude": "25.463297"
        }
    }
    axios.post(url, payload)
        .then(function (response) {
            if (response.status == 200) {
                var objectId = response.data.id;
                res.status(200).send({
                    'fbId': objectId,
                    'title': req.body.title,
                    'description': req.body.description
                });
                db.insert({
                    fbId: objectId,
                    title: req.body.title,
                    description: req.body.description,
                    location: req.body.location
                }, function (error, newDoc) {
                    console.log('Inserted new record into db, with _id = ' + newDoc["_id"]);
                });
                console.log('Status 200, id = ' + objectId);
            }
            else {
                res.status(response.status).send(response.statusText);
            }
        })
        .catch(function (error) {
            console.log(error);
            res.status(400).send(error);
        });
});

module.exports = router;