const request = require('request');
const DatabaseMongoAtlasSchema = require('./Models/model');
const express = require('express');
const _URL = require('url');
let concurrency = require('./Utilities/concurrent_engine')
const config = require('./Configurations/config');
const utility_url_methods = require('./Utilities/utils');
const cheerio = require('cheerio');
const mongoose = require('mongoose');
const _ = require('lodash/core');

const URL = require('url-parse');

const app = express();

const hyperlinks_to_be_harvested = {};
const arr_links = [];
const url = new URL(config.UrlToScrap);
CONCURRENT_REQUESTS = 5;
root_url_value = '';

let queryStringProcess = [];
/* MongoDB Initiated at localhost 27017*/
let modelMongoForURLParser;
const conn = mongoose.createConnection(config.MongoURI, {useNewUrlParser: true});
modelMongoForURLParser = conn.model('Url', DatabaseMongoAtlasSchema);

// Formatted URL must be with origin Protocol
if ( utility_url_methods === true ) {
    root_url_value = url => {
        `{$url.protocol}"//"{$url.hostname}`
    };

} else console.log(`${root_url_value}`);

let count_of_already_visited_links = 0;

// Starting with Empty array of URLs
arr_links.unshift(config.UrlToScrap);

// Calling Function to calculate visits
const globalURICall = () => complete_unique_list();
globalURICall();


// Exit Condition for Program


function complete_unique_list() {
    if ( count_of_already_visited_links >= CONCURRENT_REQUESTS ) {
        console.log(`Depth of Available URls Reached. Exiting`);
        return;
    }

    let next_neighbourhood_link = arr_links.pop();
    if ( next_neighbourhood_link in hyperlinks_to_be_harvested ) {

        complete_unique_list();
    } else {

        url_searching_in_next_queue(next_neighbourhood_link, complete_unique_list);
    }
}


function url_searching_in_next_queue(url, callback) {
    hyperlinks_to_be_harvested[url] = true;
    count_of_already_visited_links++;

    console.log(`I found  ${url} `);
    request(url, function (error, response, body) {

        if ( response.statusCode !== 200 ) {
            callback();
            return;
        }
        let $ = cheerio.load(body);
        spider_to_fetch_links($);

        callback();
    });
}


getQueryStringParams = query => {
    return query
        ? (/^[?#]/.test(query) ? query.slice(1) : query)
            .split('&')
            .reduce((params, param) => {
                    let [key, value] = param.split('=');
                    params[key] = value ? decodeURIComponent(value.replace(/\+/g, ' ')) : '';
                    return params;
                }, {}
            )
        : {}
};

parseQueryString = queryString => {
    var params = {}, queries, temp, i, l;
    // Split into key/value pairs
    queries = queryString.split("&");
    // Convert the array of strings into an object
    for ( i = 0, l = queries.length; i < l; i++ ) {
        temp = queries[i].split('=');
        params[temp[0]] = temp[1];
    }
    return params;
};
var resolver_query = new Promise(function(resolve, reject) {
    getQueryStringParams(url);
    queryStringProcess.push(getQueryStringParams(url));
});
resolver_query.then(function(value) {
    parseQueryString(queryStringProcess);

});
console.log(resolver_query('https://medium.com/payment?source=upgrade_membership---landing_mission'));

const spider_to_fetch_links = ($) => {
    let reachable_links_href;
    reachable_links_href = $("a[href^='/']");
    let absolute_links;
    absolute_links = $("a[href^='http']");
    console.log("Came Across " + reachable_links_href.length + " hyperlinks on All Page");
    console.log("Came Across " + absolute_links.length + " absolute links");

    reachable_links_href.each(function () {
        arr_links.push(root_url_value + $(this).attr('href'));
        let url_sliced = _URL.parse(url.protocol + '/' + url.hostname + $(this).attr('href'), true);

        let swap = utility_url_methods.RemoveAllDuplicates(arr_links);
        for (let j = 0; j < swap.length; j++) if ( arr_links.indexOf(swap[j]) === -1 ) {
            arr_links.push(swap[j]);
            console.log([swap[j]]);
        }
        let data = ([...new Set(arr_links.map(x => x.root_url_value))].map(
            x => {
                return {
                    url: url_sliced.href.split('?')[0],
                    reference_count: '',
                    params: '',
                }
            }));

        var sendDatatoMongo = new modelMongoForURLParser(data);
        console.log('Data is pushed at ObjectID' + sendDatatoMongo);
    });

    absolute_links.each(function () {
        arr_links.push($(this).attr('href'));

    });
};

app.get('/', function(req, res){
    res.send("Hello RentoMojo!");
});

app.get('/scrap_the_web', spider_to_fetch_links);
app.listen(3000)
console.log('Express is up and Running ' + config.port);
exports = module.exports = app;
