'use strict';

module.exports.detflify = function(str) {
    return str.replace('-', ' & ').replace(/(^\w|\s\w)/g, (letter) => letter.toUpperCase());
};
