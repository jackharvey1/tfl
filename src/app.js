'use strict';

const express = require('express');
require('console-stamp')(console, 'HH:MM:ss.l');
const dust = require('dustjs-linkedin');
const morgan = require('morgan');
const fs = require('fs');

const tfl = require('./js/tfl');
const db = require('./db');

const app = express();
app.use(morgan('combined'));

app.get('/', (req, res) => {
    fs.readFile('pages/test.dust', "utf8", (err, data) => {
        const compiled = dust.compile(data, "test");

        dust.loadSource(compiled);

        dust.render("test", {}, function(err, html) {
            res.send(html);
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
    db.saveAllLines().then(() => {
        db.saveAllStationsOnAllLines().then(() => {
            db.saveAllArrivalsAtAllStations();
        });
    });
});
