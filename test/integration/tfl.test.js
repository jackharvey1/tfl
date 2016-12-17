/* global sandbox, expect*/
var tfl = require('../../src/js/tfl');
var config = require('../../config/config.js');
var db = require('../../src/db');

var lines = require('../resources/lines.json');
var stationsOnVictoria = require('../resources/stations-on-victoria.json');
var arrivalsAt940X = require('../resources/arrivals-at-940X.json')

describe('TfL calls', function() {
    describe('for lines', function() {
        beforeEach(function() {
            sinon.stub(tfl, 'makeRequest', function() {
                return Promise.resolve(lines);
            });
        });

        afterEach(function() {
            tfl.makeRequest.restore();
        });

        it('should make the call correctly', function() {
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
        beforeEach(function() {
            sandbox.stub(tfl, 'makeRequest', function() {
                return Promise.resolve(stationsOnVictoria);
            });
        });

        afterEach(function() {
            db.retrieveAllLines.restore();
            tfl.getAllStationsOnLine.restore();
            tfl.makeRequest.restore();
        });

        it('should make the call for one station correctly', function() {
            return tfl.getAllStationsOnLine('victoria').then((stations) => {
                return expect(stations).to.deep.equal([
                    {
                        station: 'Blackhorse Road Underground Station',
                        naptanId: '940GZZLUBLR',
                        lines: [ 'Victoria' ],
                        lat: 51.586919,
                        lon: -0.04115
                    }, {
                        station: 'Brixton Underground Station',
                        naptanId: '940GZZLUBXN',
                        lines: [ 'Victoria' ],
                        lat: 51.462618,
                        lon: -0.114888
                    }, {
                        station: 'Euston Underground Station',
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
                        id: 'victoria'
                    }, {
                        id: 'hammersmith-city'
                    }, {
                        id: 'jubilee'
                    }
                ]);
            });

            sandbox.stub(tfl, 'getAllStationsOnLine', function(line) {
                return Promise.resolve({
                    station: `station on ${line}`,
                    naptanId: `station on ${line} id`,
                    lines: ['some', 'test', 'lines'],
                    lat: 50,
                    lon: 0
                });
            });

            return tfl.getAllStationsOnAllLines().then((stations) => {
                expect(stations).to.deep.equal([
                    {
                        station: `station on victoria`,
                        naptanId: `station on victoria id`,
                        lines: ['some', 'test', 'lines'],
                        lat: 50,
                        lon: 0
                    },{
                        station: `station on hammersmith-city`,
                        naptanId: `station on hammersmith-city id`,
                        lines: ['some', 'test', 'lines'],
                        lat: 50,
                        lon: 0
                    },{
                        station: `station on jubilee`,
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
        beforeEach(function() {
            sinon.stub(tfl, 'makeRequest', function() {
                return Promise.resolve(arrivalsAt940X);
            });
        });

        afterEach(function() {
            tfl.makeRequest.restore();
        });

        it('should make the call for all arrivals at one station correctly', function() {
            return tfl.getAllArrivalsAt('940X').then((stations) => {
                expect(stations).to.deep.equal([
                    {
                        'arrivalId': '352100931',
                        'expectedArrival': '2016-12-17T18:36:52.7022069Z',
                        'station': 'Oxford Circus Underground Station',
                        'vehicleId': '203'
                    }, {
                        'arrivalId': '1015497106',
                        'expectedArrival': '2016-12-17T18:35:52.7022069Z',
                        'station': 'Oxford Circus Underground Station',
                        'vehicleId': '210'
                    }, {
                        'arrivalId': '2002081508',
                        'expectedArrival': '2016-12-17T18:42:51.7332069Z',
                        'station': 'Oxford Circus Underground Station',
                        'vehicleId': '222'
                    }
                ]);
            });
        });
    });
});
