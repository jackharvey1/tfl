var dust = require('dustjs-linkedin');
var express = require('express')
var fs = require('fs');
var app = express()

// respond with "hello world" when a GET request is made to the homepage
app.get('/', (req, res) => {
	fs.readFile('pages/test.dust', "utf8", (err, data) => {
		var compiled = dust.compile(data, "test");

		dust.loadSource(compiled);

		dust.render("test", {}, function(err, html_out) {
			//HTML output
			res.send(html_out);
		});
	})
	// res.send('hello world')
}).listen(3000, () => {
	console.log('Listening on port 3000')
});
