var db = require('./../db');
var config = require('./../../config/config');
var detflify = require('./helpers').detflify;
var flatten = require('lodash/flattenDeep');
var https = require('https');

const appId = config.app.id;
const appKey = config.app.key;

function getAllArrivalsAt(station) {
    options = {
        host: 'api.tfl.gov.uk',
        path: `/StopPoint/${station}/Arrivals?app_id=${appId}&app_key=${appKey}`
    };

    return new Promise((resolve, reject) => {
        return module.exports.makeRequest(options).then((data) => {
            var arrivals = [];
            for (var i = 0; i < data.length; i++) {
                arrivals.push({
                    arrivalId: data[i].id,
                    vehicleId: data[i].vehicleId,
                    station: data[i].stationName,
                    expectedArrival: data[i].expectedArrival
                });
            }
            resolve(arrivals);
        });
    });
}

function getAllStationsOnAllLines() {
    return db.retrieveAllLines().then((linesData) => {
        var lines = [];
        for (var l = 0; l < linesData.length; l++) {
            lines.push(linesData[l].id);
        }

        return Promise.all(
            lines.map(module.exports.getAllStationsOnLine)
        ).then((stations) => {
            return flatten(stations);
        });
    });
}

function getAllStationsOnLine(line) {
    options = {
        host: 'api.tfl.gov.uk',
        path: `/Line/${line}/StopPoints?app_id=${appId}&app_key=${appKey}`
    };

    console.log(`Retrieving all stations on ${detflify(line)}`);

    return new Promise((resolve, reject) => {
        return module.exports.makeRequest(options).then((data) => {
            var stations = [];
            for (var i = 0; i < data.length; i++) {
                lines = [];
                var tubeLocation;
                for (var m = 0; m < data[i].lineModeGroups.length; m++) {
                    if (data[i].lineModeGroups[m].modeName === 'tube') {
                        tubeLocation = m;
                        break;
                    }
                }

                for (var l = 0; l < data[i].lineModeGroups[tubeLocation].lineIdentifier.length; l++) {
                    lines.push(detflify(data[i].lineModeGroups[tubeLocation].lineIdentifier[l]));
                }

                stations.push({
                    station: data[i].commonName,
                    naptanId: data[i].naptanId,
                    lines: lines,
                    lat: data[i].lat,
                    lon: data[i].lon
                });
            }
            resolve(stations);
        });
    });
}

function getAllLines() {
    options = {
        host: 'api.tfl.gov.uk',
        path: `/Line/Mode/tube/Route?app_id=${appId}&app_key=${appKey}`
    };

    console.log('Retrieving all lines');

    //module.exports is needed for the tests, is there a better way?
    return module.exports.makeRequest(options).then((data) => {
        var lines = [];
        for (var i = 0; i < data.length; i++) {
            console.log(data[i].name);
            lines.push({
                name: data[i].name,
                id: data[i].id
            });
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

module.exports = {
    getAllArrivalsAt,
    getAllStationsOnAllLines,
    getAllStationsOnLine,
    getAllLines,
    makeRequest
};
