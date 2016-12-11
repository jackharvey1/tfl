var db = require('./../db');
var config = require('./../../config/config');
var https = require('https');

const appId = config.app.id;
const appKey = config.app.key;

module.exports.getAllStationsOnAllLines = function() {
    return db.retrieveAllLines().then((lines) => {
        var tubeStations = [];
        for (var l = 0; l < lines.length; l++) {
            console.log('line', l, lines[l].line);
            getAllStations(lines[l].line).then((stations) => {
                tubeStations.push({
                    line: lines[l].line,
                    stations: stations
                });
                console.log('stations');
                console.log(stations);
            });
        }
        return Promise.resolve(tubeStations);
    });
}

function getAllStations(line) {
    options = {
        host: 'api.tfl.gov.uk',
        path: `/Line/${line}/StopPoints?app_id=${appId}&app_key=${appKey}`
    };

    console.log(`Retrieving all stations on ${line}`);

    return new Promise((resolve, reject) => {
        return makeRequest(options).then((data) => {
            var stations = [];
            for (var i = 0; i < data.length; i++) {
                stations.push(data[i].commonName);
            }
            // console.log(stations);
            resolve(stations);
        });
    });
}

module.exports.getAllLines = function() {
    options = {
        host: 'api.tfl.gov.uk',
        path: `/Line/Mode/tube/Route?app_id=${appId}&app_key=${appKey}`
    };

    console.log('Retrieving all lines');

    return makeRequest(options).then((data) => {
        var lines = [];
        for (var i = 0; i < data.length; i++) {
            lines.push(data[i].name);
        }
        return Promise.resolve(lines);
    });
}

function makeRequest(options) {
    return new Promise((resolve, reject) => {
        return https.get(options, (response) => {
            var data = '';

            response.on('error', (err) => {
                reject(err);
            });

            response.on('data', (chunk) => {
                data += chunk;
            });

            response.on('end', () => {
                resolve(JSON.parse(data));
            });
        });
    });
}
