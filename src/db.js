const tfl = require('./js/tfl');
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/tfl');

const lineSchema = new mongoose.Schema({
    name: String,
    id: { type: String, unique: true },
    updated_at: { type: Date, default: Date.now }
});

const stationSchema = new mongoose.Schema({
    stationName: String,
    naptanId: { type: String, unique: true },
    lines: Array,
    lat: Number,
    lon: Number,
    updated_at: { type: Date, default: Date.now }
});

const arrivalSchema = new mongoose.Schema({
    arrivalId: { type: String, unique: true },
    station: String,
    vehicleId: Number,
    expectedArrival: Date
});

const Line = mongoose.model('Lines', lineSchema);
const Station = mongoose.model('Stations', stationSchema);
const Arrival = mongoose.model('Arrivals', arrivalSchema);

function saveAllArrivalsAtAllStations(station) {
    return new Promise((resolve, reject) => {
        tfl.getAllArrivalsAtAllStations(station).then((arrivals) => {
            arrivals.forEach((arrival) => {
                Arrival.count({ arrivalId: arrival.arrivalId }, (err, count) => {
                    if (!count) {
                        var arrivalEntry = new Arrival({
                            arrivalId: arrival.arrivalId,
                            vehicleId: arrival.vehicleId,
                            station: arrival.station,
                            expectedArrival: arrival.expectedArrival
                        });

                        arrivalEntry.save((err) => {
                            if (err) {
                                console.log(err);
                            } else {
                                console.log(`Arrival with id ${arrival.arrivalId} saved`);
                            }
                        });
                    } else {
                        console.log(`Arrival with id ${arrival.arrivalId} already exists`)
                    }
                });
            });
            resolve();
        });
    });
}

function saveAllStationsOnAllLines() {
    return new Promise ((resolve, reject) => {
        tfl.getAllStationsOnAllLines().then((stations) => {
            stations.forEach((station, index) => {
                Station.count({ naptanId: station.naptanId }, (err, count) => {
                    if (!count) {
                        var stationEntry = new Station({
                            stationName: station.stationName,
                            naptanId: station.naptanId,
                            lines: station.lines,
                            lat: station.lat,
                            lon: station.lon
                        });

                        stationEntry.save((err) => {
                            if (err) {
                                console.log(err);
                            } else {
                                console.log(`${station.stationName} saved`);
                            }
                        });
                    } else {
                        console.log(`${station.stationName} already exists`);
                    }
                });
            });
            resolve();
        });
    });
}

function saveAllLines() {
    return new Promise((resolve, reject) => {
        tfl.getAllLines().then((lines) => {
            lines.forEach((line) => {
                Line.count({ id: line.id }, (err, count) => {
                    if (!count) {
                        var lineEntry = new Line({
                            name: line.name,
                            id: line.id
                        });

                        lineEntry.save((err) => {
                            if (err) {
                                console.log(err);
                            } else {
                                console.log(`${line.name} saved`);
                            }
                        });
                    } else {
                        console.log(`${line.name} already exists`)
                    }
                });
            });
            resolve();
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

function retrieveAllStationsOnAllLines() {
    return new Promise((resolve, reject) => {
        Station.find({}, (err, stations) => {
            if (err) {
                return reject(err);
            }
            resolve(stations)
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

function clearDatabase() {
    return Promise.all([
        Line.remove({}),
        Station.remove({}),
        Arrival.remove({})
    ]).then(() => {
        console.log('Database cleared');
    });
}

module.exports = {
    clearDatabase,
    saveAllArrivalsAtAllStations,
    saveAllStationsOnAllLines,
    saveAllLines,
    retrieveAllLines,
    retrieveAllStationsOnLine,
    retrieveAllStationsOnAllLines
};
