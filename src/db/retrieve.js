const models = require('./models');
const Line = models.Line;
const Station = models.Station;
const Route = models.Route;
const Arrival = models.Arrival;

module.exports.allArrivalsOnAllLines = function() {
    return retrieve(Arrival);
};

module.exports.allRoutesOnAllLines = function() {
    return retrieve(Route);
};

module.exports.allStationsOnAllLines = function() {
    return retrieve(Station);
};

module.exports.allStationsOnLine = function(line) {
    return retrieve(Station, { lines: line });
};

module.exports.allLines = function() {
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
