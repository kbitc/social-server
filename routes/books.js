const express = require('express');
const axios = require('axios');
const querystring = require('querystring');
const cheerio = require('cheerio');
var winston = require('winston');

var router = express.Router();

const koha = 'https://koha.outikirjastot.fi';
const search = '/cgi-bin/koha/opac-search.pl?idx=&q=';
const details = '/cgi-bin/koha/opac-detail.pl?biblionumber=';
const ouluLocation = '&branch_group_limit=branch%3AOUPK';

var logger = winston.loggers.get('books');

router.get('/', function (req, res) {
    if (req.query.search != null) {
        logger.info('Request to search', { search: req.query.search });
        var query = req.query.search.replace(/ /g, '+');
        var url = koha + search + query + ouluLocation;
        var config = {
            headers: {
                host: 'koha.outikirjastot.fi'
            }
        };
        axios.get(url, config)
            .then(function (response) {
                var results = parseSearchResultsPage(response.data);
                logger.info('Found entries', { count: results.length });
                res.status(200).send({
                    data: results
                });
            })
            .catch(function (error) {
                res.status(error.response.status).send(error.response.statusText);
            });
    }
    else if (req.query.id != null) {
        logger.info('Request to retrieve details', { id: req.query.id });
        var url = koha + details + req.query.id;
        var config = {
            headers: {
                host: 'koha.outikirjastot.fi'
            }
        };
        axios.get(url, config)
            .then(function (response) {
                var book = parseBookDetailsPage(response.data);
                book["bookId"] = req.query.id;
                res.status(200).send({
                    data: book
                });
            })
            .catch(function (error) {
                res.status(error.response.status).send(error.response.statusText);
            });
    }
    else {
        res.status(400).send('Include <search> or <id> in the query');
    }
});

function parseBookDetailsPage(page) {
    var book = {};
    var $ = cheerio.load(page);
    var bookInfo = $('#catalogue_detail_biblio').children('.record');
    var holdsInfo = $('.holdingst');
    book['title'] = $(bookInfo).find('.title').text();
    book['cover'] = $(bookInfo).find('.jokunen_image_container').children('img').attr('src');
    var authors = [];
    $(bookInfo).find('.author').find('span').each(function (index, element) {
        if ($(element).attr('property') == 'name') {
            authors.push($(element).text());
        }
    });
    book['author'] = authors.join(';');
    book['type'] = $(bookInfo).find('.results_summary.type').text();
    book['language'] = $(bookInfo).find('.results_summary.language').children('img').attr('alt');
    var pubArray = [];
    $(bookInfo).find('.results_summary.publisher').find('span').each(function (index, element) {
        var property = $(element).attr('property');
        var location = (property == 'location');
        var name = (property == 'name');
        var datePublished = (property == 'datePublished');
        if (location || name || datePublished) {
            pubArray.push($(element).text());
        }
    });
    book['publisher'] = pubArray.join('');
    $(bookInfo).find('.results_summary.description > *').each(function (index, element) {
        if ($(element).attr('property') == 'description') {
            book['description'] = $(element).text().trim();
        }
    });
    $(bookInfo).find('.results_summary.isbn > *').each(function (index, element) {
        if ($(element).attr('property') == 'isbn') {
            book['isbn'] = $(element).text().trim();
        }
    });
    // Holds data
    book['locations'] = [];
    $(holdsInfo).find('tbody').children().each(function (index, element) {
        var library = $(element).find('.location').children('div');
        var libraryName = $(library).text().trim();
        if (libraryName == 'Oulun kaupungin pääkirjasto') {
            // Location fetching
            var locationModel = {};
            var locationCallNumber = $(element).find('.call_no');
            locationModel['callNumber'] = $(locationCallNumber).text().trim();
            // Collection fetching
            var collection = $(element).find('.collection');
            if (collection != null && collection.text().trim() != '') locationModel['collection'] = collection.text().trim();
            book['locations'].push(locationModel);
        }
    });
    book['locations'] = removeDuplicates(book);
    return book;
};

function parseSearchResultsPage(page) {
    var $ = cheerio.load(page);
    var searchResultsTable = $('#userresults').find('table > tbody');
    var searchResults = [];
    $(searchResultsTable).children('tr').each(function (index, element) {
        var info = $(element).find('.bibliocol');
        var titleA = $(info, 'p').find('.title');
        var authorSpan = $(info, 'p').find('.author');
        var coverA = $(info, 'a').find('.jokunen_image_container');
        var materialSpan = $(info, 'span').find('.results_summary');
        var languageSpan = $(info, 'span').find('.results_summary.language');
        var publisherSpan = $(info, 'span').find('.results_summary.publisher');
        var title = $(titleA).text().trim();
        var href = $(titleA).attr('href');
        var cover = $(coverA).children('img').attr('src');
        var bookId = querystring.parse(href, '?')["biblionumber"];
        var author = $(authorSpan).text().trim();
        var materialType = $(materialSpan).children('img').attr('alt');
        var language = $(languageSpan).children('img').attr('alt');
        var publisher = $(publisherSpan).text().trim();
        var book = {
            title: title,
            author: author,
            cover: cover,
            bookId: bookId,
            type: materialType,
            language: language,
            publisher: publisher
        };
        searchResults.push(book);
    });
    return searchResults;
};

function removeDuplicates(book) {
    var locations = book.locations;
    // Removing duplicates
    var duplicates = [];
    for (var index = 0; (index < locations.length) && (!duplicates.includes(index)); index++) {
        var currentLocation = locations[index];
        for (var other = 0; (other < locations.length) && (other != index); other++) {
            var otherLocation = locations[other];
            var callNumbersEqual = (currentLocation.callNumber === otherLocation.callNumber);
            var collExist = (currentLocation.collection != null) && (otherLocation.collection != null);
            var collEqual = (currentLocation.collection === otherLocation.collection);
            if (callNumbersEqual && (!collExist || (collExist && collEqual))) duplicates.push(other);
        }
    }
    duplicates.forEach(function (value) {
        locations.splice(value, 1);
    });
    return locations;
};

module.exports = router;