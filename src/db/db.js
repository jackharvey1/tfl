'use strict';

const tfl = require('../js/tfl');
const models = require('./models');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const flatten = require('lodash/flattenDeep');

const Line = models.Line;
const Station = models.Station;
const Arrival = models.Arrival;

mongoose.connect('mongodb://localhost/tfl');

function saveAllArrivalsAtAllStations(station) {
    return tfl.getAllArrivalsAtAllStations(station).then((arrivals) => {
        return Promise.all(
            arrivals.map((arrival) => {
                return new Promise((resolve) => {
                    Arrival.count({ arrivalId: arrival.arrivalId }, (err, count) => {
                        if (count > 0) {
                            resolve(false);
                        } else {
                            const arrivalEntry = new Arrival({
                                arrivalId: arrival.arrivalId,
                                vehicleId: arrival.vehicleId,
                                station: arrival.station,
                                expectedArrival: arrival.expectedArrival
                            });

                            arrivalEntry.save((err) => {
                                if (!err) {
                                    resolve(true);
                                }
                            });
                        }
                    });
                });
            })
        ).then((arrivals) => {
            arrivals = flatten(arrivals);

            const skipped = arrivals.filter((a) => {
                return a === true;
            }).length;

            const saved = arrivals.filter((a) => {
                return a === false;
            }).length;

            console.log(`Arrivals: ${saved} saved and ${skipped} already saved.`);
        });
    });
}

function saveAllStationsOnAllLines() {
    return tfl.getAllStationsOnAllLines().then((stations) => {
        return Promise.all(
            stations.map((station) => {
                return new Promise((resolve) => {
                    Station.count({ naptanId: station.naptanId }, (err, count) => {
                        if (count > 0) {
                            resolve(false);
                        } else {
                            const stationEntry = new Station({
                                stationName: station.stationName,
                                naptanId: station.naptanId,
                                lines: station.lines,
                                lat: station.lat,
                                lon: station.lon
                            });

                            stationEntry.save((err) => {
                                if (!err) {
                                    resolve(true);
                                }
                            });
                        }
                    });
                });
            })
        ).then((stations) => {
            stations = flatten(stations);

            const skipped = stations.filter((s) => {
                return s === false;
            }).length;

            const saved = stations.filter((s) => {
                return s === true;
            }).length;

            console.log(`Stations: ${saved} saved and ${skipped} already saved.`);
        });
    });
}

function saveAllLines() {
    return tfl.getAllLines().then((lines) => {
        return Promise.all(
            lines.map((line) => {
                return new Promise((resolve) => {
                    Line.count({ id: line.id }, (err, count) => {
                        if (count > 0) {
                            resolve(false);
                        } else {
                            const lineEntry = new Line({
                                name: line.name,
                                id: line.id
                            });

                            lineEntry.save((err) => {
                                if (!err) {
                                    resolve(true);
                                }
                            });
                        }
                    });
                });
            })
        ).then((lines) => {
            lines = flatten(lines);

            const skipped = lines.filter((l) => {
                return l === false;
            }).length;

            const saved = lines.filter((l) => {
                return l === true;
            }).length;

            console.log(`Lines: ${saved} saved and ${skipped} already saved.`);
        });
    });
}

function cleanArrivals() {
    const now = new Date();

    Arrival.remove({
        expectedArrival: {$lt: now}
    }, (err, obj) => {
        console.log(`Removed ${obj.result.n} arrival entries`);
    });
}

function retrieveAllStationsOnAllLines() {
    return new Promise((resolve, reject) => {
        Station.find({}, (err, stations) => {
            if (err) {
                return reject(err);
            }
            resolve(stations);
        });
    });
}

function retrieveAllStationsOnLine(line) {
    return new Promise((resolve, reject) => {
        Station.find({ lines: line }, (err, stations) => {
            if (err) {
                return reject(err);
            }
            resolve(stations);
        });
    });
}

function retrieveAllLines() {
    return new Promise((resolve, reject) => {
        Line.find({}, (err, lines) => {
            if (err) {
                return reject(err);
            }
            resolve(lines);
        });
    });
}

function clearDatabase() {
    return Promise.all([
        Line.remove({}, () => {
            return new Promise((resolve) => {
                resolve();
            });
        }),
        Station.remove({}, () => {
            return new Promise((resolve) => {
                resolve();
            });
        }),
        Arrival.remove({}, () => {
            return new Promise((resolve) => {
                resolve();
            });
        })
    ]).then(() => {
        console.log('Database cleared');
    });
}

module.exports = {
    clearDatabase,
    cleanArrivals,
    saveAllArrivalsAtAllStations,
    saveAllStationsOnAllLines,
    saveAllLines,
    retrieveAllLines,
    retrieveAllStationsOnLine,
    retrieveAllStationsOnAllLines
};
