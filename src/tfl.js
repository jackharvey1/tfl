var dust = require('dustjs-linkedin');
var express = require('express')
var fs = require('fs');

var api = require('./js/api');

var app = express()

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
    api.getAllLines().then((lines) => {
        res.json(lines);
        res.end();
    })
});

app.listen(3000, () => {
    console.log('Listening on port 3000')
});
