const tfl = require('../js/tfl');
const models = require('./models');
const parseSaveResults = require('./utils').parseSaveResults;
const lineColours = require('../resources/line-colours.json');

const Line = models.Line;
const Station = models.Station;
const Route = models.Route;
const Arrival = models.Arrival;

module.exports.allArrivalsAtAllStations = function() {
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

module.exports.allRoutesOnAllLines = function() {
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

module.exports.allStationsOnAllLines = function() {
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

module.exports.allLines = function() {
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
