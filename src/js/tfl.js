'use strict';

const https = require('https');
const flatten = require('lodash/flattenDeep');
const removeDuplicatesBy = require('lodash/uniqBy');
const db = require('../db/db');
const detflify = require('../helpers/utils').detflify;
const cleanStationName = require('../helpers/utils').cleanStationName;

let appId;
let appKey;

if (process.env.APP_ID && process.env.APP_KEY) {
    appId = process.env.APP_ID;
    appKey = process.env.APP_KEY;
} else {
    appId = require('./../../config/config').app.id || process.env.APP_ID;
    appKey = require('./../../config/config').app.key || process.env.APP_KEY;
}

module.exports.getAllArrivalsAtAllStations = function() {
    return db.retrieveAllStationsOnAllLines().then((stations) => {
        console.info(`Getting all arrivals at all stations`);

        return Promise.all(
            stations.map((station) => {
                return station.stationId;
            }).map(module.exports.getAllArrivalsAt)
        ).then((arrivals) => {
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
    return db.retrieveAllLines().then((lines) => {
        console.info(`Retrieving all stations on all lines`);
        return Promise.all(
            lines.map((line) => {
                return line.id;
            }).map(module.exports.getAllStationsOnLine)
        ).then((stations) => {
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

    return db.retrieveAllLines().then((lines) => {
        return Promise.all(
            lines.map((line) => {
                return line.id;
            }).map((line) => {
                options.path = `/Line/${line}/Route/Sequence/outbound?excludeCrowding=false&serviceTypes=regular,night&app_key=${appKey}&app_id=${appId}`;
                return module.exports.makeRequest(options).then((data) => {
                    const routeStrs = data.lineStrings;
                    const routesArr = [];
                    routesArr.push({ line });
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
            })
        ).then((routes) => {
            return routes;
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
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    console.log(e);
                }
            });
        });
    });
};
