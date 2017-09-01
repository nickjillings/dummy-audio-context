var assert = require('assert');
var vm = require("vm");
var fs = require("fs");
var sandbox = {
    globalVar: 1
};
vm.createContext(sandbox);
module.exports = function (path, context) {
    var data = fs.readFileSync(path);
    vm.runInNewContext(data, context, path);
};
module.exports('./audio-context.js', sandbox);

var context = new sandbox.AudioContext();

describe("Context", function () {
    describe("Initial States", function () {
        it("context.state should be suspended", function (done) {
            assert.ok(context.state == "suspended");
            done();
        });
    });
});

describe("Nodes", function () {
    describe("GainNode", function () {
        var gain;
        it("context.createGain should return a GainNode", function (done) {
            gain = context.createGain();
            assert.ok(gain.constructor === sandbox.GainNode);
            done();
        });
        it("GainNode should have an AudioParam called gain", function (done) {
            assert.ok(gain.gain.constructor === sandbox.AudioParam);
            done();
        });
        it("GainNode.connect() should connect to the given node", function (done) {
            assert.ok(gain.connect(context.destination) === context.destination);
            done();
        });
        it("GainNode.connect() should disconnect to the given node", function (done) {
            assert.ok(gain.disconnect(context.destination) === undefined);
            done();
        });
    });
});
