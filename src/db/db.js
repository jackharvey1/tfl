'use strict';

const tfl = require('../js/tfl');
const models = require('./models');
const mongoose = require('mongoose');
const flatten = require('lodash/flattenDeep');
const lineColours = require('../resources/line-colours.json');

const Line = models.Line;
const Station = models.Station;
const Route = models.Route;
const Arrival = models.Arrival;

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/tfl');

module.exports.saveAllArrivalsAtAllStations = function() {
    return tfl.getAllArrivalsAtAllStations().then((arrivals) => {
        return Promise.all(
            arrivals.map((arrival) => {
                return new Promise((resolve) => {
                    Arrival.count({ arrivalId: arrival.arrivalId }, (err, count) => {
                        if (count > 0) {
                            resolve(null);
                        } else {
                            const expected = new Date(arrival.expectedArrival);
                            expected.setMilliseconds(0);

                            const arrivalEntry = new Arrival({
                                arrivalId: arrival.arrivalId,
                                vehicleId: arrival.vehicleId,
                                stationId: arrival.stationId,
                                expectedArrival: expected
                            });

                            arrivalEntry.save((err) => {
                                if (err) {
                                    resolve(false);
                                } else {
                                    resolve(true);
                                }
                            });
                        }
                    });
                });
            })
        ).then((arrivals) => {
            const results = parseSaveResults(arrivals);

            console.log(`Arrivals: ${results.saved} saved, ${results.errored} errored and ${results.skipped} already saved`);
        });
    });
};

module.exports.saveAllRoutesOnAllLines = function() {
    return tfl.getAllRoutesOnAllLines().then((paths) => {
        return Route.remove(() => {
            return Promise.resolve();
        }).then(() => {
            return Promise.all(
                paths.map((pathGroup) => {
                    return new Promise((resolve) => {
                        const currRoute = {
                            line: pathGroup[0].line,
                            pointGroups: []
                        };

                        for (let j = 1; j < pathGroup.length; j++) {
                            currRoute.pointGroups.push([]);
                            for (let k = 0; k < pathGroup[j].length; k++) {
                                currRoute.pointGroups[j - 1].push({
                                    lat: pathGroup[j][k].lat,
                                    lon: pathGroup[j][k].lon
                                });
                            }
                        }

                        const routeEntry = new Route(currRoute);

                        routeEntry.save((err) => {
                            if (err) {
                                resolve(false);
                            } else {
                                resolve(true);
                            }
                        });
                    });
                })
            ).then((parsedPaths) => {
                const results = parseSaveResults(parsedPaths);

                console.log(`Route groups: ${results.saved} saved and ${results.errored} errored`);
            });
        });
    });
};

module.exports.saveAllStationsOnAllLines = function() {
    return tfl.getAllStationsOnAllLines().then((stations) => {
        return Promise.all(
            stations.map((station) => {
                return new Promise((resolve) => {
                    Station.count({ stationId: station.stationId }, (err, count) => {
                        if (count > 0) {
                            resolve(null);
                        } else {
                            const stationEntry = new Station({
                                stationName: station.stationName,
                                stationId: station.stationId,
                                lines: station.lines,
                                lat: station.lat,
                                lon: station.lon
                            });

                            stationEntry.save((err) => {
                                if (err) {
                                    resolve(false);
                                } else {
                                    resolve(true);
                                }
                            });
                        }
                    });
                });
            })
        ).then((stations) => {
            const results = parseSaveResults(stations);

            console.log(`Stations: ${results.saved} saved, ${results.errored} errored and ${results.skipped} already saved`);
        });
    });
};

module.exports.saveAllLines = function() {
    return tfl.getAllLines().then((lines) => {
        return Promise.all(
            lines.map((line) => {
                return new Promise((resolve) => {
                    Line.count({ id: line.id }, (err, count) => {
                        if (count > 0) {
                            resolve(null);
                        } else {
                            const lineEntry = new Line({
                                name: line.name,
                                id: line.id,
                                colour: lineColours[line.id]
                            });

                            lineEntry.save((err) => {
                                if (err) {
                                    resolve(false);
                                } else {
                                    resolve(true);
                                }
                            });
                        }
                    });
                });
            })
        ).then((lines) => {
            const results = parseSaveResults(lines);

            console.log(`Lines: ${results.saved} saved, ${results.errored} errored and ${results.skipped} already saved`);
        });
    });
};

module.exports.retrieveAllArrivalsOnAllLines = function() {
    return retrieve(Arrival);
};

module.exports.retrieveAllRoutesOnAllLines = function() {
    return retrieve(Route);
};

module.exports.retrieveAllStationsOnAllLines = function() {
    return retrieve(Station);
};

module.exports.retrieveAllStationsOnLine = function(line) {
    return retrieve(Station, { lines: line });
};

module.exports.retrieveAllLines = function() {
    return retrieve(Line);
};

function retrieve(model, query = {}) {
    return new Promise((resolve, reject) => {
        model.find(query, (err, result) => {
            if (err) {
                reject(err);
            }
            resolve(result);
        });
    });
}

module.exports.clearDatabase = function() {
    const models = [
        {
            name: Line,
            string: 'lines'
        }, {
            name: Station,
            string: 'stations'
        }, {
            name: Route,
            string: 'routes'
        }, {
            name: Arrival,
            string: 'arrivals'
        }
    ];

    return Promise.all(models.map((model) => {
        return new Promise((resolve) => {
            model.name.remove({}, (err, obj) => {
                resolve({
                    model: model.string,
                    count: obj.result.n
                });
            });
        });
    })).then((removals) => {
        removals.forEach((removal) => {
            console.log(`Removed ${removal.count} ${removal.model}`);
        });
    });
};

module.exports.cleanArrivals = function() {
    const now = new Date();

    Arrival.remove({
        expectedArrival: {$lt: now}
    }, (err, obj) => {
        console.log(`Cleaned up ${obj.result.n} arrival entries`);
    });
};

module.exports.runArrivalCheckJob = function() {
    const now = new Date().setMilliseconds(0);

    return new Promise((resolve) => {
        Arrival.find({
            expectedArrival: {$eq: now}
        }, (err, arrivals) => {
            resolve(arrivals);
        });
    });
};

function parseSaveResults(results) {
    results = flatten(results);

    const skipped = results.filter((result) => {
        return result === null;
    }).length;

    const saved = results.filter((result) => {
        return result === true;
    }).length;

    const errored = results.filter((result) => {
        return result === false;
    }).length;

    return {
        skipped,
        saved,
        errored
    };
}
