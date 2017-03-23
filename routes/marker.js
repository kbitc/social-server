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
    console.log(markerId);
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
//267088810405306
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
                    'markerId': objectId
                });
                db.insert({
                    fbId: objectId,
                    title: req.body.title,
                    description: req.body.desc,
                    location: req.body.loc
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
        });
});

router.delete('/', cors(), jsonParser, function (req, res) {
    console.log(JSON.stringify(req.body));
    res.status(200).send({
        'markerId': 0
    });
});

router.put('/', cors(), jsonParser, function (req, res) {
    console.log(JSON.stringify(req.body));
    res.status(200).send({
        'markerId': 0
    });
});

module.exports = router;