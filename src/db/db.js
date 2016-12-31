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

module.exports.saveAllRoutesOnAllLines = function() {
    return tfl.getAllRoutesOnAllLines().then((paths) => {
        return Route.remove(() => {
            return new Promise((resolve) => {
                resolve();
            });
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
                parsedPaths = flatten(parsedPaths);

                const saved = parsedPaths.filter((a) => {
                    return a === true;
                }).length;

                const errored = parsedPaths.filter((a) => {
                    return a === false;
                }).length;

                console.log(`Route groups: ${saved} saved and ${errored} errored.`);
            });
        });
    });
};

module.exports.saveAllArrivalsAtAllStations = function() {
    return tfl.getAllArrivalsAtAllStations().then((arrivals) => {
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
            stations = flatten(stations);

            const skipped = stations.filter((s) => {
                return s === null;
            }).length;

            const saved = stations.filter((s) => {
                return s === true;
            }).length;

            const errored = stations.filter((s) => {
                return s === null;
            }).length;

            console.log(`Stations: ${saved} saved, ${skipped} already saved and ${errored} errors.`);
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
                            resolve(false);
                        } else {
                            const lineEntry = new Line({
                                name: line.name,
                                id: line.id,
                                colour: lineColours[line.id]
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
};

module.exports.cleanArrivals = function() {
    const now = new Date();

    Arrival.remove({
        expectedArrival: {$lt: now}
    }, (err, obj) => {
        console.log(`Removed ${obj.result.n} arrival entries`);
    });
};

module.exports.retrieveAllRoutesOnAllLines = function() {
    return new Promise((resolve, reject) => {
        Route.find({}, (err, routes) => {
            if (err) {
                reject(err);
            }
            resolve(routes);
        });
    });
};

module.exports.retrieveAllStationsOnAllLines = function() {
    return new Promise((resolve, reject) => {
        Station.find({}, (err, stations) => {
            if (err) {
                return reject(err);
            }
            resolve(stations);
        });
    });
};

module.exports.retrieveAllStationsOnLine = function(line) {
    return new Promise((resolve, reject) => {
        Station.find({ lines: line }, (err, stations) => {
            if (err) {
                return reject(err);
            }
            resolve(stations);
        });
    });
};

module.exports.retrieveAllLines = function() {
    return new Promise((resolve, reject) => {
        Line.find({}, (err, lines) => {
            if (err) {
                return reject(err);
            }
            resolve(lines);
        });
    });
};

module.exports.clearDatabase = function() {
    return Promise.all([
        Line.remove({}, (err, obj) => {
            return new Promise((resolve) => {
                resolve({
                    lines: obj.result.n
                });
            });
        }),
        Station.remove({}, (err, obj) => {
            return new Promise((resolve) => {
                resolve({
                    stations: obj.result.n
                });
            });
        }),
        Route.remove({}, (err, obj) => {
            return new Promise((resolve) => {
                resolve({
                    routes: obj.result.n
                });
            });
        }),
        Arrival.remove({}, (err, obj) => {
            return new Promise((resolve) => {
                resolve({
                    arrivals: obj.result.n
                });
            });
        })
    ]).then((removals) => {
        removals.forEach((removal) => {
            console.log(`Removed ${removal}`);
        });
    });
};
