const models = require('./models');
const flatten = require('lodash/flattenDeep');

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
            expectedArrival: { $eq: now }
        }, (err, arrivals) => {
            resolve(arrivals);
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
