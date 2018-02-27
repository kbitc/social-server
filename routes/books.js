const express = require('express');
const axios = require('axios');
const querystring = require('querystring');
const cheerio = require('cheerio');
var winston = require('winston');
var xml2js = require('xml2js');

var router = express.Router();

// For koha
const koha = 'https://koha.outikirjastot.fi';
const search = '/cgi-bin/koha/opac-search.pl?idx=&q=';
const details = '/cgi-bin/koha/opac-detail.pl?biblionumber=';
const ouluLocation = '&branch_group_limit=branch%3AOUPK';

// https://koha.outikirjastot.fi/cgi-bin/koha/opac-search.pl?idx=ti&q=Sota&idx=kw&limit=mc-itype%2Cphr%3AKI&limit-yr=&limit=branch%3AOUPK&sort_by=pubdate_dsc&do=Search

// For goodreads
const goodreads = 'https://www.goodreads.com';
const byISBN = '/book/isbn/';
const byTitle = '/search/index.xml';

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
    else if (req.query.id != null || req.query.isbn != null) {
        var url;
        if (req.query.id != null) {
            logger.info('Request to retrieve details', { id: req.query.id });
            url = koha + details + req.query.id;
        }
        else if (req.query.isbn != null) {
            logger.info('Request to retrieve details', { isbn: req.query.isbn });
            url = koha + search + req.query.isbn + ouluLocation;
        }
        var config = {
            headers: {
                host: 'koha.outikirjastot.fi'
            }
        };
        axios.get(url, config)
            .then(function (response) {
                var book = parseBookDetailsPage(response.data);
                book["bookId"] = req.query.id;
                var gr = goodreads + byISBN + book.isbn + '?key=' + process.env.GOODREADS_TOKEN;
                axios.get(gr).then(function (response) {
                    xml2js.parseString(response.data, function (err, result) {
                        if (!err) {
                            var grData = parseGoodReadsBook(result);
                            book["goodreads"] = grData;
                        }
                        res.status(200).send({
                            data: book
                        });
                    });
                }).catch(function (error) {
                    logger.warn('Cannot retrieve goodreads details', { isbn: book.isbn });
                    res.status(200).send({
                        data: book
                    });
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

router.get('/goodreads', function (req, res) {
    if (req.query.search != null) {
        var search = req.query.search;
        logger.info('Request to search in goodreads', { search: search });
        var url = goodreads + byTitle + '?key=' + process.env.GOODREADS_TOKEN + '&q=' + search;
        axios.get(url).then(function (response) {
            xml2js.parseString(response.data, function (err, result) {
                if (!err) {
                    var grData = parseGoodreadsSearch(result);
                    res.status(200).send({
                        grData
                    });
                }
                else {
                    res.status(400).send('Error while processing goodreads response');
                }
            });
        }).catch(function (error) {
            logger.warn('Cannot retrieve goodreads details', { search: search });
            res.status(404).send('Book was not found');
        });
    }
    else {
        res.status(400).send('Include <search> in the query');
    }
});

function parseBookDetailsPage(page) {
    var book = {};
    var $ = cheerio.load(page);
    var bookInfo = $('#catalogue_detail_biblio').children('.record');
    var holdsInfo = $('#holdings').find('.holdingst');
    book['title'] = $(bookInfo).find('.title').clone().children().remove().end().text().replace(/([/])+/g, '').trim();
    book['cover'] = $('#catalogue_detail_biblio').find('.bookcover').children('img').attr('src');
    var authors = [];
    $(bookInfo).find('.author').find('span').each(function (index, element) {
        if ($(element).attr('property') == 'name') {
            authors.push($(element).text());
        }
    });
    book['authors'] = authors;
    book['type'] = $(bookInfo).find('.results_summary.type').clone().children().remove().end().text();
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
            var isbn = $(element).text().trim();
            book['isbn'] = isbn.substring(0, isbn.length - 1);
        }
    });
    // Holds data
    book['locations'] = [];
    $(holdsInfo).find('tbody').children().each(function (index, element) {
        var library = $(element).find('.location').children('span').first();
        var libraryName = $(library).text().trim();
        if (libraryName == 'Oulun kaupungin pääkirjasto') {
            // Location fetching
            var locationModel = {};
            // Availability fetching
            var available = $(element).find('.status').text().trim();
            locationModel['available'] = (available === "Available");
            // Call number fetching
            var locationCallNumber = $(element).find('.call_no');
            locationModel['callNumber'] = $(locationCallNumber).text().trim();
            // Collection fetching
            var collection = $(element).find('.collection');
            if (collection != null && collection.text().trim() != '') locationModel['collection'] = collection.text().trim();
            book['locations'].push(locationModel);
        }
    });
    return book;
};

function parseSearchResultsPage(page) {
    var $ = cheerio.load(page);
    var searchResultsTable = $('#userresults').find('table > tbody');
    var searchResults = [];
    $(searchResultsTable).children('tr').each(function (index, element) {
        var info = $(element).find('.bibliocol');
        var titleA = $(info, 'a').find('.title');
        var authorSpan = $(info, 'p').find('.author');
        var coverA = $(info, 'div').find('.p1');
        var publisherSpan = $(info, 'span').find('.results_summary.publisher');
        // .clone().children().remove().end() 
        // returns only a first text, ignoring inner spans
        var title = $(titleA).clone().children().remove().end().text();
        title = title.replace(/([/])+/g, '').trim();
        var href = $(titleA).attr('href');
        var cover = $(coverA).children('img').attr('src');
        var bookId = querystring.parse(href, '?')["biblionumber"];
        var authorNodes = $(authorSpan).clone().children().remove().end().contents();
        var authors = [];
        $(authorNodes).each(function (index, element) {
            var authorName = $(element).text();
            authorName = authorName.replace(/([.])+/g, '');
            if (authorName != '') authors.push(authorName);
        });
        var publisher = $(publisherSpan).clone().children().remove().end().text().trim();
        var book = {
            title: title,
            authors: authors,
            cover: cover,
            bookId: bookId,
            publisher: publisher
        };
        searchResults.push(book);
    });
    return searchResults;
};

function parseGoodReadsBook(page) {
    var grData = {};
    var mainBook = page.GoodreadsResponse.book[0];
    grData['id'] = mainBook['id'][0];
    grData['title'] = mainBook['title'][0];
    grData['rating'] = mainBook['average_rating'][0];
    grData['publisher'] = mainBook['publisher'][0];
    grData['publish_year'] = mainBook['publication_year'][0];
    grData['cover'] = mainBook['image_url'][0];
    grData['authors'] = [];
    for (var j = 0; j < mainBook['authors'][0]['author'].length; j++) {
        var author = mainBook['authors'][0]['author'][j];
        grData['authors'].push(author['name'][0]);
    }
    var similar = [];
    for (var i = 0; i < mainBook['similar_books'][0]['book'].length; i++) {
        var similarBook = mainBook['similar_books'][0]['book'][i];
        var authors = [];
        for (var k = 0; k < similarBook['authors'][0]['author'].length; k++) {
            var author = similarBook['authors'][0]['author'][k];
            authors.push(author['name'][0]);
        }
        similar.push({
            id: similarBook['id'][0],
            title: similarBook['title'][0],
            cover: similarBook['image_url'][0],
            isbn: similarBook['isbn13'][0],
            rating: similarBook['average_rating'][0],
            authors: authors
        });
    }
    grData['similar'] = similar;
    return grData;
}

function parseGoodreadsSearch(response) {
    var grData = [];
    var results = response.GoodreadsResponse.search[0].results[0].work;
    for (var i = 0; i < results.length; i++) {
        var book = results[i];
        var authors = [];
        var authorsData = book["best_book"][0]["author"];
        for (var j = 0; j < authorsData.length; j++) {
            var author = authorsData[j];
            authors.push(author.name[0]);
        }
        grData.push({
            grID: book["id"][0]["_"],
            rating: book["average_rating"][0],
            title: book["best_book"][0]["title"][0],
            authors: authors,
            cover: book["best_book"][0]["image_url"][0]
        });
    }
    return grData;
}

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