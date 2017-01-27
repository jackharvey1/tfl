/* global expect */

'use strict';

const utils = require('../../src/helpers/utils');

describe('Helper functions', function() {
    describe('of type utility', function() {
        it('finds duplicates', function() {
            let arr = [
                {
                    line: 'bakerloo',
                    pointGroups: [
                        [
                            {
                                lat: '51.4',
                                lon: '-0.3'
                            }, {
                                lat: '50.0',
                                lon: '-0.1'
                            }, {
                                lat: '50.1',
                                lon: '-0.2'
                            }
                        ]
                    ]
                }, {
                    line: 'victoria',
                    pointGroups: [
                        [
                            {
                                lat: '50.0',
                                lon: '-0.1'
                            }, {
                                lat: '50.1',
                                lon: '-0.2'
                            }, {
                                lat: '51.0',
                                lon: '-0.2'
                            }
                        ]
                    ]
                }, {
                    line: 'northern',
                    pointGroups: [
                        [
                            {
                                lat: '50.0',
                                lon: '-0.1'
                            }, {
                                lat: '50.1',
                                lon: '-0.2'
                            }
                        ]
                    ]
                }
            ];

            arr = utils.bunchDuplicatePointPairs(arr);

            expect(arr).to.deep.equal([
                {
                    lines: ['bakerloo'],
                    pair: [
                        {
                            lat: '51.4',
                            lon: '-0.3'
                        },
                        {
                            lat: '50.0',
                            lon: '-0.1'
                        }
                    ]
                }, {
                    lines: ['bakerloo', 'victoria', 'northern'],
                    pair: [
                        {
                            lat: '50.0',
                            lon: '-0.1'
                        }, {
                            lat: '50.1',
                            lon: '-0.2'
                        }
                    ]
                }, {
                    lines: ['victoria'],
                    pair: [
                        {
                            lat: '50.1',
                            lon: '-0.2'
                        }, {
                            lat: '51.0',
                            lon: '-0.2'
                        }
                    ]
                }
            ]);
        });

        it('finds equivalence in arrays of objects', function() {
            const arr1 = [
                {
                    a: 1,
                    b: 2
                }
            ];

            const arr2 = [
                {
                    a: 1,
                    b: 2
                }
            ];

            expect(utils.equals(arr1, arr2)).to.equal(true);
        });
    });
});
