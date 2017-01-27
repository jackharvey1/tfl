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
    return model.find(query)
        .then((result) => {
            return result;
        })
        .catch((e) => {
            throw e;
        });
}
