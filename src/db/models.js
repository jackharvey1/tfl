const mongoose = require('mongoose');

const lineSchema = new mongoose.Schema({
    name: String,
    id: { type: String, unique: true },
    colour: String
});

const stationSchema = new mongoose.Schema({
    stationName: String,
    stationId: { type: String, unique: true },
    lines: Array,
    lat: Number,
    lon: Number
});

const routeSchema = new mongoose.Schema({
    line: String,
    pointGroups: Array
});

const arrivalSchema = new mongoose.Schema({
    arrivalId: { type: String, unique: true },
    station: String,
    vehicleId: Number,
    expectedArrival: Date
});

module.exports.Line = mongoose.model('Lines', lineSchema);
module.exports.Station = mongoose.model('Stations', stationSchema);
module.exports.Route = mongoose.model('Routes', routeSchema);
module.exports.Arrival = mongoose.model('Arrivals', arrivalSchema);
