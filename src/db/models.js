const mongoose = require('mongoose');

const lineSchema = new mongoose.Schema({
    name: String,
    id: { type: String, unique: true },
    updatedAt: { type: Date, default: Date.now }
});

const stationSchema = new mongoose.Schema({
    stationName: String,
    naptanId: { type: String, unique: true },
    lines: Array,
    lat: Number,
    lon: Number,
    updatedAt: { type: Date, default: Date.now }
});

const arrivalSchema = new mongoose.Schema({
    arrivalId: { type: String, unique: true },
    station: String,
    vehicleId: Number,
    expectedArrival: Date
});

module.exports.Line = mongoose.model('Lines', lineSchema);
module.exports.Station = mongoose.model('Stations', stationSchema);
module.exports.Arrival = mongoose.model('Arrivals', arrivalSchema);
