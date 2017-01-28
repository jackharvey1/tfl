/* eslint no-invalid-this:off */

'use strict';

const express = require('express');
const bluebird = require('bluebird');
const dust = require('dustjs-linkedin');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const db = require('./src/db/init');
const save = require('./src/db/save');
const retrieve = require('./src/db/retrieve');
const utils = require('./src/db/utils');
const max = require('./src/helpers/db').max;
const min = require('./src/helpers/db').min;
const models = require('./src/db/models');
const bunch = require('./src/helpers/utils').bunchDuplicatePointPairs;

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
    fs.readFile(path.join(__dirname, 'public/pages/main.dust'), "utf8", (err, template) => {
        const compiled = dust.compile(template, "main");
        dust.loadSource(compiled);

        dust.render("main", {}, (err, html) => {
            res.send(html);
        });
    });
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
    console.log(req.query.overground);
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

server.listen(process.env.PORT || 3000, () => {
    db();
    console.log('Listening on port 3000');

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
        save.allLines().then(() => {
            save.allRoutesOnAllLines().then(() => {
                save.allStationsOnAllLines().then(() => {
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
                });
            });
        });
    }
});
