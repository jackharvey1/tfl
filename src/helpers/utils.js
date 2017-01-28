'use strict';

module.exports.detflify = function(str) {
    return str
        .replace('-', ' & ')
        .replace(/(^\w|\s\w)/g, (letter) => letter.toUpperCase());
};

module.exports.cleanStationName = function(str) {
    return str
        .replace(' Underground Station', '')
        .replace(' DLR Station', '')
        .replace(' Rail Station', '');
};

/* eslint max-statements:off */
module.exports.bunchDuplicatePointPairs = function(routeGroups) {
    const duplicates = [];

    for (let i = 0; i < routeGroups.length; i++) {
        for (let j = 0; j < routeGroups[i].pointGroups.length; j++) {
            for (let k = 1; k < routeGroups[i].pointGroups[j].length; k++) {
                const current = [
                    routeGroups[i].pointGroups[j][k - 1],
                    routeGroups[i].pointGroups[j][k]
                ];

                const duplicateIndex = duplicates.findIndex((e) => {
                    return module.exports.equals(e.pair, current);
                });

                const line = routeGroups[i].line;

                if (duplicateIndex > -1) {
                    const alreadyHaveLine = duplicates[duplicateIndex].lines.findIndex((e) => {
                        return e === line;
                    }) !== -1;

                    if (!alreadyHaveLine) {
                        duplicates[duplicateIndex].lines.push(line);
                    }
                } else {
                    duplicates.push({
                        lines: [routeGroups[i].line],
                        pair: current
                    });
                }
            }
        }
    }

    return duplicates;
};

module.exports.equals = function(arr1, arr2) {
    if (!arr1 || !arr2) {
        return false;
    }

    if (arr1.length !== arr2.length) {
        return false;
    }

    if (typeof arr1[0] === 'object') {
        for (let a = 0; a < arr1.length; a++) {
            if (JSON.stringify(arr1[a]) !== JSON.stringify(arr2[a])) {
                return false;
            }
        }
    } else {
        for (let a = 0; a < arr1.length; a++) {
            if (arr1[a] !== arr2[a]) {
                return false;
            }
        }
    }

    return true;
};
