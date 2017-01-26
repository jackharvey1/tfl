const bluebird = require('bluebird');
const models = require('./models');
const flatten = require('lodash/flattenDeep');
const retrieve = require('./retrieve');

const Line = models.Line;
const Station = models.Station;
const Route = models.Route;
const Arrival = models.Arrival;

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

    return bluebird.map(models, (model) => {
        return model.name.remove({})
            .then((obj) => {
                return {
                    model: model.string,
                    count: obj.result.n
                };
            });
    }).then((removals) => {
        removals.forEach((removal) => {
            console.log(`Removed ${removal.count} ${removal.model}`);
        });
    }).catch((e) => {
        throw e;
    });
};

module.exports.cleanArrivals = function() {
    const now = new Date();

    return Arrival.remove({
        expectedArrival: {$lt: now}
    }).then((obj) => {
        console.log(`Cleaned up ${obj.result.n} arrival entries`);
    });
};

module.exports.runArrivalCheckJob = function() {
    const now = new Date().setMilliseconds(0);

    return Arrival.find({
        expectedArrival: { $eq: now }
    }).then((arrivals) => {
        return arrivals;
    });
};

module.exports.getNextArrivalsAtAllStations = function() {
    console.info('Getting next arrivals for all stations');
    const now = new Date();

    return retrieve.allStationsOnAllLines().then((stations) => {
        return bluebird.map(stations, (station) => {
            return Arrival.findOne({
                stationId: station.stationId,
                expectedArrival: {
                    $gt: now
                }
            })
            .sort(`expectedArrival`)
            .exec()
            .then((item) => {
                const time = item ? item.expectedArrival : 'N/A';

                return {
                    stationId: station.stationId,
                    stationName: station.stationName,
                    time
                };
            });
        }).then((nextArrivals) => {
            const numberFound = flatten(nextArrivals).filter(x => x.time !== 'N/A').length;

            console.log(`Found arrivals for ${numberFound} / ${stations.length} stations`);

            return flatten(nextArrivals);
        });
    });
};

module.exports.parseSaveResults = function(results) {
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
};
