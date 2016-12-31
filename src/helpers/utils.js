'use strict';

const unique = require('lodash/uniq');
const flatten = require('lodash/flatten');
const assign = require('lodash/assign');
const forEach = require('lodash/forEach');

module.exports.detflify = function(str) {
    return str.replace('-', ' & ').replace(/(^\w|\s\w)/g, (letter) => letter.toUpperCase());
};

module.exports.cleanStationName = function(str) {
    return str.replace(' Underground Station', '');
};

module.exports.mergeObjectArray = function(arr) {
    const merged = {};
    let keys = [];

    arr.forEach((element) => {
        keys.push(Object.keys(element));
    });

    keys = unique(flatten(keys));

    keys.forEach((key) => {
        merged[key] = {};
    });

    arr.forEach((element) => {
        keys.forEach((key) => {
            if (key in element) {
                assign(merged[key], element[key]);
            }
        });
    });

    return merged;
};
