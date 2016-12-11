var config = require('./../../config/config');
var https = require('https');

const appId = config.app.id;
const appKey = config.app.key;

function getAllLines() {
    var options = {
        host: 'api.tfl.gov.uk',
        path: `/Line/Mode/tube/Route?app_id=${appId}&app_key=${appKey}`
    };

    return new Promise((resolve, reject) => {
        console.log('Retrieving all lines');
        return https.get(options, (response) => {
            var data = '';
            response.on('data', (chunk) => {
                data += chunk;
            });

            response.on('end', () => {
                data = JSON.parse(data);
                var lines = [];
                for (var i = 0; i < data.length; i++) {
                    lines.push(data[i].name);
                }
                resolve(lines);
            });
        });
    });
}

module.exports = {
    getAllLines
};
