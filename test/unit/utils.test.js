/* global expect */

'use strict';

const util = require('../../src/helpers/utils');

describe('Helper functions', function() {
    describe('of type utility', function() {
        it('merges arrays of objects', function() {
            let arr = [{
                one: {
                    oneone: 1
                }
            }, {
                one: {
                    onetwo: 1
                }
            }, {
                two: {
                    twoone: 2
                }
            }];

            arr = util.mergeObjectArray(arr);

            expect(arr).to.deep.equal({
                one: {
                    oneone: 1,
                    onetwo: 1
                }, two: {
                    twoone: 2
                }
            });
        });

        it('flattens object arrays', function() {
            let arr = [
                {
                    lat: 50,
                    lon: 0
                }, {
                    lat: 51,
                    lon: 1
                }
            ];

            arr = util.flattenObjectArray(arr);

            expect(arr).to.deep.equal([
                [
                    50,
                    0
                ], [
                    51,
                    1
                ]
            ]);
        });
    });
});
