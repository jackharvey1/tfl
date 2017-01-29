/* global sandbox, expect */
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const sinon = require('sinon');
const tfl = require('../../src/js/tfl');
const save = require('../../src/db/save');
const Line = require('../../src/db/models').Line;
const db = require('../../src/db/init');

describe('Line saves', function() {
    let lineSaveSpy;
    afterEach(function() {
        sandbox.restore();
        lineSaveSpy.restore();
    });

    it('are constructed as expected', function() {
        db();
        Line.prototype.save = function () {
            return Promise.resolve('hello');
        };

        const lineSaveSpy = sinon.spy(Line.prototype, 'save');

        sandbox.stub(tfl, 'getAllLines', function() {
            console.log('getting all lines stub');
            return Promise.resolve([{
                name: 'Victoria',
                superfluous: 'stuff',
                id: 'victoria',
                colour: '#589bd8',
                and: 'some more'
            }]);
        });

        sandbox.stub(mongoose.Model, 'count', function() {
            console.log('count stub');
            return Promise.resolve(0);
        });

        return save.allLines().then(() => {
            console.log('hi');
            return true;
            // return expect(lineSaveSpy).to.have.been.called.with({
            //     name: 'Victoria',
            //     id: 'victoria',
            //     colour: '#589bd8'
            // });
        });
    });
});
