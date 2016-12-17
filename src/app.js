var dust = require('dustjs-linkedin');
var express = require('express')
var fs = require('fs');

var tfl = require('./js/tfl');
var db = require('./db');

var app = express();

/*
    USE LAT-LONG from /Line/$line/StopPoints endpoint to draw map
*/


app.get('/', (req, res) => {
    fs.readFile('pages/test.dust', "utf8", (err, data) => {
        var compiled = dust.compile(data, "test");

        dust.loadSource(compiled);

        dust.render("test", {}, function(err, html) {
            res.send(html);
        });
    })
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
            tfl.getAllArrivalsAt('940GZZLUMSH');
        });
    });
});
