/* eslint no-invalid-this:off */

'use strict';

const express = require('express');
const bluebird = require('bluebird');
const morgan = require('morgan');
const path = require('path');

const db = require('./db/init');
const save = require('./db/save');
const retrieve = require('./db/retrieve');
const utils = require('./db/utils');
const max = require('./db/helpers').max;
const min = require('./db/helpers').min;
const models = require('./db/models');
const bunch = require('./helpers/utils').bunchDuplicatePointPairs;

require('console-stamp')(console, 'HH:MM:ss.l');

const Station = models.Station;

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

app.use(morgan('combined'));
app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', () => {
    console.log('User connected');

    utils.getNextArrivalsAtAllStations().then((arrivals) => {
        io.emit('stationArrivals', arrivals);
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/pages/main.html'));
});

app.get('/bounds', (req, res) => {
    bluebird.all([
        max(Station, 'lat'),
        min(Station, 'lat'),
        max(Station, 'lon'),
        min(Station, 'lon')
    ]).spread((maxLat, minLat, maxLon, minLon) => {
        res.send({
            lat: {
                max: maxLat.lat.max,
                min: minLat.lat.min
            }, lon: {
                max: maxLon.lon.max,
                min: minLon.lon.min
            }
        });
    });
});

app.get('/stations/:line', (req, res) => {
    if (req.params.line === 'all') {
        retrieve.allStationsOnAllLines().then((stations) => {
            res.json(stations);
            res.end();
        });
    } else {
        retrieve.allStationsOnLine(req.params.line).then((stations) => {
            res.json(stations);
            res.end();
        });
    }
});

app.get('/lines', (req, res) => {
    retrieve.allLines().then((lines) => {
        res.json(lines);
        res.end();
    });
});

app.get('/routes', (req, res) => {
    retrieve.allRoutesOnAllLines().then((routes) => {
        res.json(bunch(routes));
        res.end();
    });
});

app.get('/linesandroutes', (req, res) => {
    bluebird.all([
        retrieve.allLines(),
        retrieve.allRoutesOnAllLines()
    ]).spread((lines, routes) => {
        res.json({
            lines,
            routes: bunch(routes)
        });
        res.end();
    });
});

server.listen(process.env.PORT || 3000, () => {
    console.log('Listening on port 3000');
    db();

    if (process.env.NODE_ENV === 'clean') {
        utils.clearDatabase().then(() => {
            process.exit(0);
        });
    } else if (process.env.NODE_ENV === 'quiet') {
        save.allLines().then(() => {
            save.allStationsOnAllLines().then(() => {
                save.allRoutesOnAllLines();
            });
        });
    } else {
        save.allLines()
            .then(save.allRoutesOnAllLines)
            .then(save.allStationsOnAllLines)
            .then(save.allArrivalsAtAllStations)
            .then(() => {
                setInterval(utils.cleanArrivals, 60 * 1000);

                setInterval(save.allArrivalsAtAllStations, 30 * 1000);

                setInterval(() => {
                    utils.runArrivalCheckJob().then((arrivals) => {
                        io.emit('arrivalsNow', arrivals);
                    });
                }, 1000);

                setInterval(() => {
                    utils.getNextArrivalsAtAllStations().then((arrivals) => {
                        io.emit('stationArrivals', arrivals);
                    });
                }, 15 * 1000);

                console.info('Jobs queued');
            });
    }
});
