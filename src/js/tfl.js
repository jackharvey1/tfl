'use strict';

const https = require('https');
const flatten = require('lodash/flattenDeep');
const db = require('./../db');
const config = require('./../../config/config');
const detflify = require('./helpers').detflify;

const appId = config.app.id;
const appKey = config.app.key;

module.exports.getAllArrivalsAtAllStations = function() {
    return db.retrieveAllStationsOnAllLines().then((stations) => {
        return Promise.all(
            stations.map((station) => {
                return station.naptanId;
            }).map(module.exports.getAllArrivalsAt)
        ).then((arrivals) => {
            return flatten(arrivals);
        });
    });
};

module.exports.getAllArrivalsAt = function(stationNaptanId) {
    const options = {
        host: 'api.tfl.gov.uk',
        path: `/StopPoint/${stationNaptanId}/Arrivals?app_id=${appId}&app_key=${appKey}`
    };

    console.log(`Getting all arrivals at ${stationNaptanId}`);

    return new Promise((resolve) => {
        return module.exports.makeRequest(options).then((data) => {
            const arrivals = [];

            data.forEach((datum) => {
                arrivals.push({
                    arrivalId: datum.id,
                    vehicleId: datum.vehicleId,
                    stationName: datum.stationName,
                    expectedArrival: datum.expectedArrival
                });
            });
            resolve(arrivals);
        });
    });
};

module.exports.getAllStationsOnAllLines = function() {
    return db.retrieveAllLines().then((lines) => {
        return Promise.all(
            lines.map((line) => {
                return line.id;
            }).map(module.exports.getAllStationsOnLine)
        ).then((stations) => {
            return flatten(stations);
        });
    });
};

module.exports.getAllStationsOnLine = function(line) {
    const options = {
        host: 'api.tfl.gov.uk',
        path: `/Line/${line}/StopPoints?app_id=${appId}&app_key=${appKey}`
    };

    console.log(`Retrieving all stations on ${detflify(line)}`);

    return new Promise((resolve) => {
        return module.exports.makeRequest(options).then((data) => {
            const stations = [];
            data.forEach((datum) => {
                const lines = [];
                let tubeLocation = 0;
                for (let m = 0; m < datum.lineModeGroups.length; m++) {
                    if (datum.lineModeGroups[m].modeName === 'tube') {
                        tubeLocation = m;
                        break;
                    }
                }

                for (let l = 0; l < datum.lineModeGroups[tubeLocation].lineIdentifier.length; l++) {
                    lines.push(detflify(datum.lineModeGroups[tubeLocation].lineIdentifier[l]));
                }

                stations.push({
                    stationName: datum.commonName,
                    naptanId: datum.naptanId,
                    lines: lines,
                    lat: datum.lat,
                    lon: datum.lon
                });
            });
            resolve(stations);
        });
    });
};

module.exports.getAllLines = function() {
    const options = {
        host: 'api.tfl.gov.uk',
        path: `/Line/Mode/tube/Route?app_id=${appId}&app_key=${appKey}`
    };

    console.log('Retrieving all lines');

    return module.exports.makeRequest(options).then((data) => {
        const lines = [];
        data.forEach((datum) => {
            lines.push({
                name: datum.name,
                id: datum.id
            });
        });

        return Promise.resolve(lines);
    });
};

module.exports.makeRequest = function(options) {
    return new Promise((resolve, reject) => {
        return https.get(options, (response) => {
            let data = '';

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
};
