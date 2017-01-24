'use strict';

const mongoose = require('mongoose');

module.exports = function() {
    mongoose.Promise = global.Promise;

    if (process.env.NODE_ENV === 'production') {
        mongoose.connect(process.env.MONGODB_URI);
    } else {
        mongoose.connect('mongodb://localhost/tfl');
    }
};
