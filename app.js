/* eslint no-invalid-this:off */

'use strict';

const express = require('express');
const dust = require('dustjs-linkedin');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const db = require('./src/db/db');
const merge = require('./src/helpers/utils').mergeObjectArray;
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
    Promise.all([
        max(Station, 'lat'),
        min(Station, 'lat'),
        max(Station, 'lon'),
        min(Station, 'lon')
    ]).then((obj) => {
        res.send(merge(obj));
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

app.get('/lines', (req, res) => {
    db.retrieveAllLines().then((lines) => {
        res.json(lines);
        res.end();
    });
});

app.get('/routes', (req, res) => {
    db.retrieveAllRoutesOnAllLines().then((routes) => {
        res.json(bunch(routes));
        res.end();
    });
});

server.listen(3000, () => {
    console.log('Listening on port 3000');
    if (process.env.NODE_ENV === 'clean') {
        db.clearDatabase().then(() => {
            process.exit(0);
        });
    } else if (process.env.NODE_ENV === 'quiet') {
        db.saveAllLines().then(() => {
            db.saveAllStationsOnAllLines().then(() => {
                db.saveAllRoutesOnAllLines();
            });
        });
    } else {
        db.saveAllLines().then(() => {
            db.saveAllRoutesOnAllLines().then(() => {
                db.saveAllStationsOnAllLines().then(() => {
                    setInterval(db.cleanArrivals, 60 * 1000);

                    setInterval(db.saveAllArrivalsAtAllStations, 20 * 1000);

                    setInterval(() => {
                        db.runArrivalCheckJob().then((arrivals) => {
                            io.emit('arrivals', arrivals);
                        });
                    }, 1000);
                });
            });
        });
    }
});
