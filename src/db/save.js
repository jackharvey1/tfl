const bluebird = require('bluebird');
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
        return bluebird.map(arrivals, (arrival) => {
            return Arrival.count({ arrivalId: arrival.arrivalId })
                .then((count) => {
                    if (count > 0) {
                        return null;
                    } else {
                        const expected = new Date(arrival.expectedArrival);
                        expected.setMilliseconds(0);

                        const arrivalEntry = new Arrival({
                            arrivalId: arrival.arrivalId,
                            vehicleId: arrival.vehicleId,
                            stationId: arrival.stationId,
                            expectedArrival: expected
                        });

                        return arrivalEntry.save()
                            .then(() => true)
                            .catch(() => false);
                    }
                });
        }).then((arrivals) => {
            const results = parseSaveResults(arrivals);

            console.log(`Arrivals: ${results.saved} saved, ${results.errored} errored and ${results.skipped} already saved`);
        });
    });
};

module.exports.allRoutesOnAllLines = function() {
    return tfl.getAllRoutesOnAllLines().then((paths) => {
        return Route.remove({})
            .then(() => {
                return bluebird.map(paths, (pathGroup) => {
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

                    return routeEntry.save()
                        .then(() => true)
                        .catch(() => false);
                });
            })
        .then((parsedPaths) => {
            const results = parseSaveResults(parsedPaths);

            console.log(`Route groups: ${results.saved} saved and ${results.errored} errored`);
        });
    });
};

module.exports.allStationsOnAllLines = function() {
    return tfl.getAllStationsOnAllLines().then((stations) => {
        return bluebird.map(stations, (station) => {
            return Station.count({ stationId: station.stationId }).then((count) => {
                if (count > 0) {
                    return null;
                } else {
                    const stationEntry = new Station({
                        stationName: station.stationName,
                        stationId: station.stationId,
                        lines: station.lines,
                        lat: station.lat,
                        lon: station.lon
                    });

                    stationEntry.save()
                        .then(() => true)
                        .catch(() => false);
                }
            });
        })
        .then((stations) => {
            const results = parseSaveResults(stations);

            console.log(`Stations: ${results.saved} saved, ${results.errored} errored and ${results.skipped} already saved`);
        });
    });
};

module.exports.allLines = function() {
    return tfl.getAllLines().then((lines) => {
        return bluebird.map(lines, (line) => {
            return Line.count({ id: line.id }).then((count) => {
                if (count > 0) {
                    return null;
                } else {
                    const lineEntry = new Line({
                        name: line.name,
                        id: line.id,
                        colour: lineColours[line.id]
                    });

                    return lineEntry.save()
                        .then(() => true)
                        .catch(() => false);
                }
            });
        }).then((lines) => {
            const results = parseSaveResults(lines);

            console.log(`Lines: ${results.saved} saved, ${results.errored} errored and ${results.skipped} already saved`);
        });
    });
};
