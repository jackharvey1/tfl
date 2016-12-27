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

const db = require('./src/db/db');
const merge = require('./src/helpers/utils').mergeObjectArray;
const max = require('./src/helpers/db').max;
const min = require('./src/helpers/db').min;
const models = require('./src/db/models');

const Station = models.Station;

const app = express();

app.use(morgan('combined'));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/list', (req, res) => {
    fs.readFile(path.join(__dirname, 'public/pages/list.dust'), "utf8", (err, template) => {
        const compiled = dust.compile(template, "list");
        dust.loadSource(compiled);

        db.retrieveAllStationsOnAllLines().then((stations) => {
            dust.render("list", {stations}, function(err, html) {
                res.send(html);
            });
        });
    });
});

app.get('/', (req, res) => {
    fs.readFile(path.join(__dirname, 'public/pages/main.dust'), "utf8", (err, template) => {
        const compiled = dust.compile(template, "leaflet");
        dust.loadSource(compiled);

        dust.render("leaflet", {}, function(err, html) {
            res.send(html);
        });
    });
});

app.get('/mapData', (req, res) => {
    Promise.all([
        max(Station, 'lat'),
        min(Station, 'lat'),
        max(Station, 'lon'),
        min(Station, 'lon')
    ]).then((obj) => {
        const minimaxes = merge(obj);

        forEach(minimaxes, (m) => {
            assign(m, { diff: Math.round((m.max - m.min) * 100) / 100 });
        });

        db.retrieveAllStationsOnAllLines().then((stations) => {
            return new Promise((resolve) => {
                forEach(stations, (station) => {
                    delete station._id;
                    delete station.naptanId;
                    delete station.__v;
                    delete station.updatedAt;
                });
                resolve(stations);
            });
        }).then((stations) => {
            res.send({stations, minimaxes});
        });
    });
});

app.get('/lines', (req, res) => {
    db.retrieveAllLines().then((lines) => {
        res.json(lines);
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
