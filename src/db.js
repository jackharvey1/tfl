var tfl = require('./js/tfl');
var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/tfl');

var lineSchema = new mongoose.Schema({
    name: String,
    id: String,
    updated_at: { type: Date, default: Date.now }
});

var stationSchema = new mongoose.Schema({
    station: String,
    naptanId: String,
    lines: Array,
    lat: Number,
    lon: Number,
    updated_at: { type: Date, default: Date.now }
});

var arrivalSchema = new mongoose.Schema({
    station: String,
    vehicleId: Number,
    expectedArrival: Date
});

var Line = mongoose.model('Line', lineSchema);
var Station = mongoose.model('Station', stationSchema);
var Arrivals = mongoose.model('Arrivals', arrivalSchema);

// I'm saving stations twice because they're on multiple lines
function saveAllArrivalsAt(station) {
    return new Promise((resolve, reject) => {
        tfl.getAllArrivalsAt(station).then((arrivals) => {
            for (var a = 0; a < arrivals.length; a++) {
                if (Arrivals.where({ 'arrivalId': arrival[a].arrivalId }).count() < 1) {
                    var arrival = new Arrival({
                        arrivalId: data[i].id,
                        vehicleId: data[i].vehicleId,
                        station: data[i].stationName,
                        expectedArrival: data[i].expectedArrival
                    });

                    arrival.save((err) => {
                        if (err) {
                            console.log(err);
                        }
                    });
                }
            }
            resolve();
        });
    });
}

function saveAllLines() {
    return new Promise((resolve, reject) => {
        tfl.getAllLines().then((lines) => {
            Line.remove({}, () => {
                for (var l = 0; l < lines.length; l++) {
                    var line = new Line({
                        name: lines[l].name,
                        id: lines[l].id
                    });

                    line.save((err) => {
                        if (err) {
                            console.log(err);
                        }
                    });
                }
                resolve();
            });
        });
    });
}

function saveAllStationsOnAllLines() {
    return new Promise ((resolve, reject) => {
        tfl.getAllStationsOnAllLines().then((stations) => {
            Station.remove({}, () => {
                for (var s = 0; s < stations.length; s++) {
                    var station = new Station({
                        station: stations[s].station,
                        naptanId: stations[s].naptanId,
                        lines: stations[s].lines,
                        lat: stations[s].lat,
                        lon: stations[s].lon
                    });

                    station.save((err) => {
                        if (err) {
                            console.log(err);
                        }
                    });
                }
                resolve();
            });
        });
    });
}

function retrieveAllLines() {
    console.log('in db');
    return new Promise((resolve, reject) => {
        Line.find((err, lines) => {
            if (err) {
                return reject(err);
            }
            resolve(lines);
        });
    });
}

function retrieveAllStationsOnLine(line) {
    return new Promise((resolve, reject) => {
        Station.find({ lines: line }, (err, stations) => {
            if (err) {
                return reject(err);
            }
            resolve(stations)
        });
    });

}

function retrieveAllStationsOnAllLines() {
    return new Promise((resolve, reject) => {
        Station.find((err, stations) => {
            if (err) {
                return reject(err);
            }
            resolve(stations)
        });
    });
}

module.exports = {
    saveAllArrivalsAt,
    saveAllLines,
    saveAllStationsOnAllLines,
    retrieveAllLines,
    retrieveAllStationsOnLine,
    retrieveAllStationsOnAllLines
};
