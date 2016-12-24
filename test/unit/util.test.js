/* global expect */

'use strict';

const util = require('../../src/helpers/util');

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
    });
});
