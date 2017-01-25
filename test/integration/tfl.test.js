/* global sandbox, expect */
const tfl = require('../../src/js/tfl');
const retrieve = require('../../src/db/retrieve');

const lines = require('../resources/lines.json');
const stationsOnVictoria = require('../resources/stations-on-victoria.json');
const arrivalsAt940X = require('../resources/arrivals-at-940X.json');

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
                        stationName: 'Blackhorse Road',
                        stationId: '940GZZLUBLR',
                        lines: ['Victoria'],
                        lat: 51.586919,
                        lon: -0.04115
                    }, {
                        stationName: 'Brixton',
                        stationId: '940GZZLUBXN',
                        lines: ['Victoria'],
                        lat: 51.462618,
                        lon: -0.114888
                    }, {
                        stationName: 'Euston',
                        stationId: '940GZZLUEUS',
                        lines: ['Northern', 'Victoria'],
                        lat: 51.528055,
                        lon: -0.132182
                    }
                ]);
            });
        });

        it('should make the call for all stations correctly', function() {
            sandbox.stub(retrieve, 'allLines', function() {
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
                    stationId: `station on ${line} id`,
                    lines: ['some', 'test', 'lines'],
                    lat: 50,
                    lon: 0
                });
            });

            return tfl.getAllStationsOnAllLines().then((stations) => {
                return expect(stations).to.deep.equal([
                    {
                        stationName: `station on victoria`,
                        stationId: `station on victoria id`,
                        lines: ['some', 'test', 'lines'],
                        lat: 50,
                        lon: 0
                    }, {
                        stationName: `station on hammersmith-city`,
                        stationId: `station on hammersmith-city id`,
                        lines: ['some', 'test', 'lines'],
                        lat: 50,
                        lon: 0
                    }, {
                        stationName: `station on jubilee`,
                        stationId: `station on jubilee id`,
                        lines: ['some', 'test', 'lines'],
                        lat: 50,
                        lon: 0
                    }
                ]);
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
                        stationId: '940GZZLUOXC',
                        vehicleId: '203'
                    }, {
                        arrivalId: '1015497106',
                        expectedArrival: '2016-12-17T18:35:52.7022069Z',
                        stationId: '940GZZLUOXC',
                        vehicleId: '210'
                    }, {
                        arrivalId: '2002081508',
                        expectedArrival: '2016-12-17T18:42:51.7332069Z',
                        stationId: '940GZZLUOXC',
                        vehicleId: '222'
                    }
                ]);
            });
        });

        it('should make the call for arrivals at all stations correctly', function() {
            sandbox.stub(retrieve, 'allStationsOnAllLines', function() {
                return Promise.resolve([
                    {
                        stationName: `King's Cross`,
                        stationId: `940XKGX`,
                        lines: ['Metropolitan', 'Victoria', 'Northern'],
                        lat: 50,
                        lon: 0
                    }, {
                        stationName: `Bank`,
                        stationId: `940XBNK`,
                        lines: ['Northern', 'Central'],
                        lat: 50,
                        lon: 0
                    }, {
                        stationName: `Highbury & Islington`,
                        stationId: `940XISL`,
                        lines: ['Victoria'],
                        lat: 50,
                        lon: 0
                    }
                ]);
            });

            sandbox.stub(tfl, 'getAllArrivalsAt', function(stationId) {
                return Promise.resolve({
                    arrivalId: `arrival at ${stationId}`,
                    vehicleId: `vehicleId`,
                    stationName: `${stationId}`,
                    expectedArrival: `1970-01-01T12.00.00.00000`
                });
            });

            return tfl.getAllArrivalsAtAllStations().then((stations) => {
                expect(stations).to.deep.equal([
                    {
                        arrivalId: `arrival at 940XKGX`,
                        vehicleId: `vehicleId`,
                        stationName: `940XKGX`,
                        expectedArrival: `1970-01-01T12.00.00.00000`
                    }, {
                        arrivalId: `arrival at 940XBNK`,
                        vehicleId: `vehicleId`,
                        stationName: `940XBNK`,
                        expectedArrival: `1970-01-01T12.00.00.00000`
                    }, {
                        arrivalId: `arrival at 940XISL`,
                        vehicleId: `vehicleId`,
                        stationName: `940XISL`,
                        expectedArrival: `1970-01-01T12.00.00.00000`
                    }
                ]);
            });
        });
    });
});
