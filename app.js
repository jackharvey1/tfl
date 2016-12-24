'use strict';

const express = require('express');
require('console-stamp')(console, 'HH:MM:ss.l');
const dust = require('dustjs-linkedin');
const morgan = require('morgan');
const assign = require('lodash/assign');
const forEach = require('lodash/forEach');
const CronJob = require('cron').CronJob;
const path = require('path');
const fs = require('fs');

const tfl = require('./src/js/tfl');
const db = require('./src/db/db');
const merge = require('./src/helpers/utils').mergeObjectArray;
const max = require('./src/helpers/db').max;
const min = require('./src/helpers/db').min;
const models = require('./src/db/models');

const Station = models.Station;

const app = express();

app.use(morgan('combined'));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    fs.readFile(path.join(__dirname, 'public/pages/main.dust'), "utf8", (err, template) => {
        Promise.all([
            max(Station, 'lat'),
            min(Station, 'lat'),
            max(Station, 'lon'),
            min(Station, 'lon')
        ]).then((obj) => {
            const compiled = dust.compile(template, "main");
            const minimaxes = merge(obj);
            dust.loadSource(compiled);

            forEach(minimaxes, (m) => {
                assign(m, { diff: Math.round((m.max - m.min) * 100) / 100 });
            });

            db.retrieveAllStationsOnAllLines().then((stations) => {
                return new Promise((resolve) => {
                    forEach(stations, (station) => {
                        station.top = Math.round((minimaxes.lat.max - station.lat) * 1000) / 1000;
                        station.left = Math.round((station.lon - minimaxes.lon.min) * 1000) / 1000;
                        station.top *= 2500;
                        station.left *= 2500;
                        delete station._id;
                        delete station.naptanId;
                        delete station.__v;
                        delete station.updatedAt;
                    });
                    resolve(stations);
                });
            }).then((stations) => {
                dust.render("main", {stations, minimaxes}, function(err, html) {
                    res.send(html);
                });
            });
        });
    });
});

app.get('/lines', (req, res) => {
    db.retrieveAllLines().then((lines) => {
        res.json(lines);
        res.end();
    });
});

app.get('/stations/:line', (req, res) => {
    if (req.params.line === 'all') {
        db.retrieveAllStationsOnAllLines().then((stations) => {
            res.json(stations);
            res.end();
        });
    } else {
        db.retrieveAllStationsOnLine(req.params.line).then((stations) => {
            res.json(stations);
            res.end();
        });
    }
});

app.get('arrivals/:station', (req, res) => {
    tfl.getArrivalsAt(req.params.station).then((arrivals) => {
        res.json(arrivals);
        res.end();
    });
});

app.listen(3000, () => {
    console.log('Listening on port 3000');
    if (process.env.NODE_ENV === 'clean') {
        db.clearDatabase();
    } else if (process.env.NODE_ENV === 'quiet') {
        db.saveAllLines().then(() => {
            db.saveAllStationsOnAllLines();
        });
    } else if (!process.env.NODE_ENV || process.env.NODE_ENV === 'live') {
        db.saveAllLines().then(() => {
            db.saveAllStationsOnAllLines().then(() => {
                new CronJob('* * * * *', function() {
                    db.cleanArrivals();
                }, null, true);

                new CronJob('* * * * *', function() {
                    db.saveAllArrivalsAtAllStations();
                }, null, true);
            });
        });
    }
});
