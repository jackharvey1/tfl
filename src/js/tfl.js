'use strict';

const https = require('https');
const flatten = require('lodash/flattenDeep');
const removeDuplicatesBy = require('lodash/uniqBy');
const db = require('./../db/db');
const config = require('./../../config/config');
const detflify = require('../helpers/utils').detflify;

const appId = config.app.id;
const appKey = config.app.key;

module.exports.getAllArrivalsAtAllStations = function() {
    return db.retrieveAllStationsOnAllLines().then((stations) => {
        console.info(`Getting all arrivals at all stations`);

        return Promise.all(
            stations.map((station) => {
                return station.naptanId;
            }).map(module.exports.getAllArrivalsAt)
        ).then((arrivals) => {
            return removeDuplicatesBy(flatten(arrivals), 'arrivalId');
        });
    });
};

module.exports.getAllArrivalsAt = function(stationNaptanId) {
    const options = {
        host: 'api.tfl.gov.uk',
        path: `/StopPoint/${stationNaptanId}/Arrivals?app_id=${appId}&app_key=${appKey}`
    };

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
        console.info(`Retrieving all stations on all lines`);

        return Promise.all(
            lines.map((line) => {
                return line.id;
            }).map(module.exports.getAllStationsOnLine)
        ).then((stations) => {
            return removeDuplicatesBy(flatten(stations), 'naptanId');
        });
    });
};

module.exports.getAllStationsOnLine = function(line) {
    const options = {
        host: 'api.tfl.gov.uk',
        path: `/Line/${line}/StopPoints?app_id=${appId}&app_key=${appKey}`
    };

    return new Promise((resolve) => {
        return module.exports.makeRequest(options).then((data) => {
            const stations = [];
            data.forEach((datum) => {
                const linesAtStation = [];
                let tubeLocation = 0;
                for (let m = 0; m < datum.lineModeGroups.length; m++) {
                    if (datum.lineModeGroups[m].modeName === 'tube') {
                        tubeLocation = m;
                        break;
                    }
                }

                for (let l = 0; l < datum.lineModeGroups[tubeLocation].lineIdentifier.length; l++) {
                    linesAtStation.push(detflify(datum.lineModeGroups[tubeLocation].lineIdentifier[l]));
                }

                stations.push({
                    stationName: datum.commonName.replace(' Underground Station', ''),
                    naptanId: datum.naptanId,
                    lines: linesAtStation,
                    lat: datum.lat,
                    lon: datum.lon
                });
            });

            module.exports.getConsecutiveStations(stations).then((linkedStations) => {
                resolve(linkedStations);
            });
        });
    });
};

module.exports.getAllLines = function() {
    const options = {
        host: 'api.tfl.gov.uk',
        path: `/Line/Mode/tube/Route?app_id=${appId}&app_key=${appKey}`
    };

    console.info('Retrieving all lines');

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
