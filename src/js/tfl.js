'use strict';

const bluebird = require('bluebird');
const https = require('https');
const flatten = require('lodash/flattenDeep');
const removeDuplicatesBy = require('lodash/uniqBy');
const retrieve = require('../db/retrieve');
const detflify = require('../helpers/utils').detflify;
const cleanStationName = require('../helpers/utils').cleanStationName;

let appId;
let appKey;

if (process.env.APP_ID && process.env.APP_KEY) {
    appId = process.env.APP_ID;
    appKey = process.env.APP_KEY;
} else {
    try {
        const config = require('./../../config/config');
        appId = config.app.id;
        appKey = config.app.key;
    } catch (err) {
        console.info('App id and key not supplied. Using empty app id and key');
        appId = '';
        appKey = '';
    }
}

module.exports.getAllArrivalsAtAllStations = function() {
    return retrieve.allStationsOnAllLines().then((stations) => {
        console.info(`Getting all arrivals at all stations`);

        return bluebird.map(stations, (station) => {
            return module.exports.getAllArrivalsAt(station.stationId);
        }).then((arrivals) => {
            arrivals = removeDuplicatesBy(flatten(arrivals), 'arrivalId');

            console.log(`TFL API responded with ${arrivals.length} arrivals`);

            return arrivals;
        });
    });
};

module.exports.getAllArrivalsAt = function(stationId) {
    const options = {
        host: 'api.tfl.gov.uk',
        path: `/StopPoint/${stationId}/Arrivals?app_id=${appId}&app_key=${appKey}`
    };

    return new Promise((resolve) => {
        return module.exports.makeRequest(options).then((data) => {
            const arrivals = [];

            data.forEach((datum) => {
                arrivals.push({
                    arrivalId: datum.id,
                    vehicleId: datum.vehicleId,
                    stationId: datum.naptanId,
                    expectedArrival: datum.expectedArrival
                });
            });
            resolve(arrivals);
        });
    });
};

module.exports.getAllStationsOnAllLines = function() {
    return retrieve.allLines().then((lines) => {
        console.info(`Retrieving all stations on all lines`);
        return bluebird.map(lines, (line) => {
            return module.exports.getAllStationsOnLine(line.id);
        }).then((stations) => {
            stations = removeDuplicatesBy(flatten(stations), 'stationId');

            console.log(`TFL API responded with ${stations.length} stations`);

            return stations;
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
                    stationName: cleanStationName(datum.commonName),
                    stationId: datum.naptanId,
                    lines: linesAtStation,
                    lat: datum.lat,
                    lon: datum.lon
                });
            });

            resolve(stations);
        });
    });
};

module.exports.getAllRoutesOnAllLines = function() {
    const options = {
        host: 'api.tfl.gov.uk'
    };

    return retrieve.allLines().then((lines) => {
        return bluebird.map(lines, (line) => {
            options.path = `/Line/${line.id}/Route/Sequence/outbound?excludeCrowding=false&serviceTypes=regular,night&app_key=${appKey}&app_id=${appId}`;
            return module.exports.makeRequest(options).then((data) => {
                const routeStrs = data.lineStrings;
                const routesArr = [];
                routesArr.push({ line: line.id });
                for (let r = 0; r < routeStrs.length; r++) {
                    const routeArr = [];
                    const routes = routeStrs[r].replace(/(\[|])/g, '').split(',');
                    for (let s = 0; s < routes.length; s += 2) {
                        routeArr.push(
                            {
                                lon: routes[s],
                                lat: routes[s + 1]
                            }
                        );
                    }
                    routesArr.push(routeArr);
                }
                return routesArr;
            });
        }).then((routes) => {
            return routes;
        });
    });
};

module.exports.getAllLines = function() {
    const options = {
        host: 'api.tfl.gov.uk',
        path: `/Line/Mode/tube?app_id=${appId}&app_key=${appKey}`
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
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    console.log(e);
                }
            });
        });
    });
};
