/* global sandbox, expect */
var mongoose = require('mongoose');
var tfl = require('../../src/js/tfl');
var config = require('../../config/config.js');
var db = require('../../src/db');

var lines = require('../resources/lines.json');
var stationsOnVictoria = require('../resources/stations-on-victoria.json');
var arrivalsAt940X = require('../resources/arrivals-at-940X.json');

describe('TfL calls', function() {
    afterEach(function() {
        sandbox.restore();
    });

    describe('for lines', function() {
        it('should make the call correctly', function() {
            sandbox.stub(tfl, 'makeRequest', function() {
                return Promise.resolve(lines);
            });

            return tfl.getAllLines().then((lines) => {
                return expect(lines).to.deep.equal([
                    {
                        name: 'Bakerloo',
                        id: 'bakerloo'
                    }, {
                        name: 'Hammersmith & City',
                        id: 'hammersmith-city'
                    }, {
                        name: 'Jubilee',
                        id: 'jubilee'
                    }
                ]);
            });
        });
    });

    describe('for stations', function() {
        it('should make the call for one station correctly', function() {
            sandbox.stub(tfl, 'makeRequest', function() {
                return Promise.resolve(stationsOnVictoria);
            });

            return tfl.getAllStationsOnLine('victoria').then((stations) => {
                return expect(stations).to.deep.equal([
                    {
                        stationName: 'Blackhorse Road Underground Station',
                        naptanId: '940GZZLUBLR',
                        lines: [ 'Victoria' ],
                        lat: 51.586919,
                        lon: -0.04115
                    }, {
                        stationName: 'Brixton Underground Station',
                        naptanId: '940GZZLUBXN',
                        lines: [ 'Victoria' ],
                        lat: 51.462618,
                        lon: -0.114888
                    }, {
                        stationName: 'Euston Underground Station',
                        naptanId: '940GZZLUEUS',
                        lines: [ 'Northern', 'Victoria' ],
                        lat: 51.528055,
                        lon: -0.132182
                    }
                ]);
            });
        });

        it('should make the call for all stations correctly', function() {
            sandbox.stub(db, 'retrieveAllLines', function() {
                return Promise.resolve([
                    {
                        name: 'Victoria',
                        id: 'victoria'
                    }, {
                        name: 'Hammersmith & City',
                        id: 'hammersmith-city'
                    }, {
                        name: 'Jubilee',
                        id: 'jubilee'
                    }
                ]);
            });

            sandbox.stub(tfl, 'getAllStationsOnLine', function(line) {
                return Promise.resolve({
                    stationName: `station on ${line}`,
                    naptanId: `station on ${line} id`,
                    lines: ['some', 'test', 'lines'],
                    lat: 50,
                    lon: 0
                });
            });

            return tfl.getAllStationsOnAllLines().then((stations) => {
                return expect(stations).to.deep.equal([
                    {
                        stationName: `station on victoria`,
                        naptanId: `station on victoria id`,
                        lines: ['some', 'test', 'lines'],
                        lat: 50,
                        lon: 0
                    },{
                        stationName: `station on hammersmith-city`,
                        naptanId: `station on hammersmith-city id`,
                        lines: ['some', 'test', 'lines'],
                        lat: 50,
                        lon: 0
                    },{
                        stationName: `station on jubilee`,
                        naptanId: `station on jubilee id`,
                        lines: ['some', 'test', 'lines'],
                        lat: 50,
                        lon: 0
                    }
                ])
            });
        });
    });

    describe('for arrivals', function() {
        afterEach(function() {
            sandbox.restore();
        });

        it('should make the call for arrivals at one station correctly', function() {
            sandbox.stub(tfl, 'makeRequest', function() {
                return Promise.resolve(arrivalsAt940X);
            });

            return tfl.getAllArrivalsAt('940X').then((stations) => {
                return expect(stations).to.deep.equal([
                    {
                        arrivalId: '352100931',
                        expectedArrival: '2016-12-17T18:36:52.7022069Z',
                        stationName: 'Oxford Circus Underground Station',
                        vehicleId: '203'
                    }, {
                        arrivalId: '1015497106',
                        expectedArrival: '2016-12-17T18:35:52.7022069Z',
                        stationName: 'Oxford Circus Underground Station',
                        vehicleId: '210'
                    }, {
                        arrivalId: '2002081508',
                        expectedArrival: '2016-12-17T18:42:51.7332069Z',
                        stationName: 'Oxford Circus Underground Station',
                        vehicleId: '222'
                    }
                ]);
            });
        });

        it('should make the call for arrivals at all stations correctly', function() {
            sandbox.stub(db, 'retrieveAllStationsOnAllLines', function() {
                return Promise.resolve([
                    {
                        stationName: `King's Cross`,
                        naptanId: `940XKGX`,
                        lines: [ 'Metropolitan', 'Victoria', 'Northern' ],
                        lat: 50,
                        lon: 0
                    },{
                        stationName: `Bank`,
                        naptanId: `940XVIC`,
                        lines: [ 'Northern', 'Central' ],
                        lat: 50,
                        lon: 0
                    },{
                        stationName: `Highbury & Islington`,
                        naptanId: `940XISL`,
                        lines: [ 'Victoria' ],
                        lat: 50,
                        lon: 0
                    }
                ]);
            });

            sandbox.stub(tfl, 'getAllArrivalsAt', function(stationName) {
                return Promise.resolve({
                    arrivalId: `arrival at ${stationName}`,
                    vehicleId: `vehicleId`,
                    stationName: `${stationName}`,
                    expectedArrival: `1970-01-01T12.00.00.00000`
                });
            });

            return tfl.getAllArrivalsAtAllStations().then((stations) => {
                expect(stations).to.deep.equal([
                    {
                        arrivalId: `arrival at King's Cross`,
                        vehicleId: `vehicleId`,
                        stationName: `King's Cross`,
                        expectedArrival: `1970-01-01T12.00.00.00000`
                    },{
                        arrivalId: `arrival at Bank`,
                        vehicleId: `vehicleId`,
                        stationName: `Bank`,
                        expectedArrival: `1970-01-01T12.00.00.00000`
                    },{
                        arrivalId: `arrival at Highbury & Islington`,
                        vehicleId: `vehicleId`,
                        stationName: `Highbury & Islington`,
                        expectedArrival: `1970-01-01T12.00.00.00000`
                    }
                ])
            });
        });
    });
});
