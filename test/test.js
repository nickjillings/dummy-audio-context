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

describe("Statics", function () {
    describe("Context", function () {
        it("should be suspended", function (done) {
            assert.ok(context.state == "suspended");
            done();
        });
        it("should have a destination", function (done) {
            assert.ok(context.destination.constructor === sandbox.AudioNode);
            done();
        });
        it("should have a sampleRate", function (done) {
            assert.ok(typeof context.sampleRate === "number");
            done();
        });
        it("should have a currentTime of 0", function (done) {
            assert.equal(context.currentTime, 0);
            done();
        });
        it("should have a .suspend()", function (done) {
            assert.ok(typeof context.suspend == "function");
            done();
        });
        it("should have a .resume()", function (done) {
            assert.ok(typeof context.resume == "function");
            done();
        });
        it("should have a .close()", function (done) {
            assert.ok(typeof context.close == "function");
            done();
        });
        it("should have onstatechange", function (done) {
            assert.ok(context.onstatechange);
            done();
        });
        it("should have a .decodeAudioData()", function (done) {
            assert.ok(typeof context.decodeAudioData == "function");
            done();
        });
        it("should have a .createGain()", function (done) {
            assert.ok(typeof context.createGain == "function");
            done();
        });
        it("should have a .createDelay()", function (done) {
            assert.ok(typeof context.createDelay == "function");
            done();
        });
        it("should have a .createPanner()", function (done) {
            assert.ok(typeof context.createPanner == "function");
            done();
        });
        it("should have a .createSpatialPanner()", function (done) {
            assert.ok(typeof context.createSpatialPanner == "function");
            done();
        });
        it("should have a .createStereoPanner()", function (done) {
            assert.ok(typeof context.createStereoPanner == "function");
            done();
        });
        it("should have a .createConvolver()", function (done) {
            assert.ok(typeof context.createConvolver == "function");
            done();
        });
        it("should have a .createAnalyser()", function (done) {
            assert.ok(typeof context.createAnalyser == "function");
            done();
        });
        it(".resume should iterate through the event lists", function (done) {
            var g = context.createGain(),
                t = 0;
            g.gain.setValueAtTime(-1, t += 1);
            g.gain.setValueAtTime(1, t += 1);
            g.gain.setValueAtTime(0, t += 1);
            context.resume().then(function () {
                assert.equal(context.currentTime, t);
                assert.equal(g.gain.value, 0.0);
                done();
            });
        });
    });
    describe("AudioNode", function () {
        var node;
        it("\"new AudioNode(context, 1, 1, 1)\" should create an audio node", function (done) {
            node = new sandbox.AudioNode(context, 1, 1, 1);
            assert.ok(node.constructor === sandbox.AudioNode);
            done();
        });
        it("should have one channel", function (done) {
            assert.equal(node.channelCount, 1);
            done();
        });
        it("should have one input", function (done) {
            assert.equal(node.numberOfInputs, 1);
            done();
        });
        it("should have one output", function (done) {
            assert.equal(node.numberOfOutputs, 1);
            done();
        });
        it("should have no connections", function (done) {
            assert.equal(node.getDestinations().length, 0);
            done();
        });
        it("should have the context", function (done) {
            assert.ok(node.context === context);
            done();
        });
    });
    describe("AudioParam", function () {
        var host = new sandbox.AudioNode(context, 1, 1, 1);
        var node;
        it("\"new AudioParam(0, -1, 1)\" should create an audio parameter", function (done) {
            node = new sandbox.AudioParam(host, 0, -1, 1);
            assert.ok(node.constructor === sandbox.AudioParam);
            done();
        });
        it("should have a value equal to defaultValue", function (done) {
            assert.ok(node.value === node.defaultValue);
            done();
        });
        it("setValueAtTime should add an event which can be executed", function (done) {
            var t = context.currentTime + 1,
                v = node.value * -1;
            node.setValueAtTime(v, t);
            context.moveToNextEvent();
            assert.equal(context.currentTime, t);
            assert.equal(node.value, v);
            done();
        });
        it("linearRampToValueAtTime should add an event which can be executed", function (done) {
            var t = context.currentTime + 1,
                v = node.value * -1;
            node.linearRampToValueAtTime(v, t);
            context.moveToNextEvent();
            assert.equal(context.currentTime, t);
            assert.equal(node.value, v);
            done();
        });
        it("exponentialRampToValueAtTime should add an event which can be executed", function (done) {
            var t = context.currentTime + 1,
                v = node.value * -1;
            node.exponentialRampToValueAtTime(v, t);
            context.moveToNextEvent();
            assert.equal(context.currentTime, t);
            assert.equal(node.value, v);
            done();
        });
        it("should have exponentialRampToValueAtTime", function (done) {
            assert.ok(node.exponentialRampToValueAtTime);
            done();
        });
        it("should have setTargetAtTime", function (done) {
            assert.ok(node.setTargetAtTime);
            done();
        });
        it("should have setValueCurveAtTime", function (done) {
            assert.ok(node.setValueCurveAtTime);
            done();
        });
        it("should have cancelScheduledValues", function (done) {
            assert.ok(node.cancelScheduledValues);
            done();
        });
        it("should equal minValue if set below", function (done) {
            node.value = -100;
            assert.equal(node.value, node.minValue);
            done();
        });
        it("should equal maxValue if set above", function (done) {
            node.value = 100;
            assert.equal(node.value, node.maxValue);
            done();
        });
    });
});

describe("Connections", function () {
    describe("Node to Node", function () {
        var a = new sandbox.AudioNode(context, 1, 1, 1),
            b = new sandbox.AudioNode(context, 1, 1, 1);
        it("a.connect(b) should return b", function (done) {
            assert.ok(a.connect(b) === b);
            done();
        });
        it("a should have 1 connection", function (done) {
            assert.ok(a.getDestinations().length === 1);
            done();
        });
        it("a should be connected to b", function (done) {
            assert.ok(a.connectedTo(b));
            done();
        });
        it("a.connect(b) should return b", function (done) {
            assert.ok(a.connect(b) === b);
            done();
        });
        it("a should still have 1 connection", function (done) {
            assert.ok(a.getDestinations().length === 1);
            done();
        });
        it("a should still be connected to b", function (done) {
            assert.ok(a.connectedTo(b));
            done();
        });
        it("a.disconnect(b) should return undefined", function (done) {
            assert.ok(a.disconnect(b) === undefined);
            done();
        });
        it("a should have 0 connection", function (done) {
            assert.equal(a.getDestinations().length, 0);
            done();
        });
        it("a should not be connected to b", function (done) {
            assert.ok(a.connectedTo(b) === false);
            done();
        });
    });
    describe("Node to Param", function () {
        var node = new sandbox.AudioNode(context, 1, 1, 1),
            a = new sandbox.AudioNode(context, 1, 1, 1),
            b = new sandbox.AudioParam(node, 1, -1, 1);
        it("a.connect(b) should return b", function (done) {
            assert.ok(a.connect(b) === b);
            done();
        });
        it("a should have 1 connection", function (done) {
            assert.ok(a.getDestinations().length === 1);
            done();
        });
        it("a should be connected to b", function (done) {
            assert.ok(a.connectedTo(b));
            done();
        });
        it("a.connect(b) should return b", function (done) {
            assert.ok(a.connect(b) === b);
            done();
        });
        it("a should still have 1 connection", function (done) {
            assert.ok(a.getDestinations().length === 1);
            done();
        });
        it("a should still be connected to b", function (done) {
            assert.ok(a.connectedTo(b));
            done();
        });
        it("a.disconnect(b) should return undefined", function (done) {
            assert.ok(a.disconnect(b) === undefined);
            done();
        });
        it("a should have 0 connection", function (done) {
            assert.ok(a.getDestinations().length === 0);
            done();
        });
        it("a should not be connected to b", function (done) {
            assert.ok(a.connectedTo(b) === false);
            done();
        });
    });
    describe("Node-Node-Node", function () {
        var a = new sandbox.AudioNode(context, 1, 1, 1),
            b = new sandbox.AudioNode(context, 1, 1, 1),
            c = new sandbox.AudioNode(context, 1, 1, 1);
        a.connect(b);
        b.connect(c);
        it("a should have 1 connection", function (done) {
            assert.equal(a.getDestinations().length, 1);
            done();
        });
        it("a should be connected to b", function (done) {
            assert.ok(a.connectedTo(b));
            done();
        });
        it("b should have 1 connection", function (done) {
            assert.equal(b.getDestinations().length, 1);
            done();
        });
        it("b should be connected to c", function (done) {
            assert.ok(b.connectedTo(c));
            done();
        });
        it("c should have 0 connections", function (done) {
            assert.equal(c.getDestinations().length, 0);
            done();
        });
        it("a should be connected to c", function (done) {
            assert.ok(a.connectedTo(c));
            done();
        });
    });
    describe("Node-Param-Node", function () {
        var a = new sandbox.AudioNode(context, 1, 1, 1),
            b = new sandbox.AudioNode(context, 1, 1, 1),
            p = new sandbox.AudioParam(b, 1, -1, 1),
            c = new sandbox.AudioNode(context, 1, 1, 1);
        a.connect(p);
        b.connect(c);
        it("a should have 1 connection", function (done) {
            assert.equal(a.getDestinations().length, 1);
            done();
        });
        it("a should be connected to b", function (done) {
            assert.ok(a.connectedTo(b));
            done();
        });
        it("b should have 1 connection", function (done) {
            assert.equal(b.getDestinations().length, 1);
            done();
        });
        it("b should be connected to c", function (done) {
            assert.ok(b.connectedTo(c));
            done();
        });
        it("c should have 0 connections", function (done) {
            assert.equal(c.getDestinations().length, 0);
            done();
        });
        it("a should be connected to c", function (done) {
            assert.ok(a.connectedTo(c));
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
        it("gain.gain should have a value of 1", function (done) {
            assert.equal(gain.gain.value, 1);
            done();
        });
    });
    describe("DelayNode", function () {
        var node;
        it("context.createDelay should return a DelayNode", function (done) {
            node = context.createDelay();
            assert.ok(node.constructor === sandbox.DelayNode);
            done();
        });
        it("DelayNode should have an AudioParam called delayTime", function (done) {
            assert.ok(node.delayTime.constructor === sandbox.AudioParam);
            done();
        });
        it("delayTime should have a value of 0", function (done) {
            assert.ok(node.delayTime.value === 0);
            done();
        });
    });
    describe("AudioBuffer", function () {
        var c = 2,
            l = 1024,
            s = 48000,
            node;
        it("context.createBuffer should return a buffer", function (done) {
            node = context.createBuffer(c, l, s);
            assert.ok(node.constructor === sandbox.AudioBuffer);
            done();
        });
        it("should have " + c + " channels", function (done) {
            assert.equal(node.numberOfChannels, c);
            done();
        });
        it("should have " + l + " samples", function (done) {
            assert.equal(node.length, l);
            done();
        });
        it("should have a sampleRate of " + s, function (done) {
            assert.equal(node.sampleRate, s);
            done();
        });
        it("should have a duration of " + (l / s) + " seconds", function (done) {
            assert.equal(node.duration, l / s);
            done();
        });
        it("should have .copyFromChannel", function (done) {
            assert.ok(typeof node.copyFromChannel === "function");
            done();
        });
        it("should have .copyToChannel", function (done) {
            assert.ok(typeof node.copyToChannel === "function");
            done();
        });
        it("should have .getChannelData", function (done) {
            assert.ok(typeof node.getChannelData === "function");
            done();
        });
    });
    describe("AudioBufferSource", function () {
        var c = 2,
            l = 1024,
            s = 48000,
            buffer = context.createBuffer(c, l, s),
            node;
        it("context.createBufferSource should return an AudioBufferSource", function (done) {
            node = context.createBufferSource();
            assert.ok(node.constructor === sandbox.AudioBufferSourceNode);
            done();
        });
        it("should have a detune parameter", function (done) {
            assert.ok(node.detune.constructor === sandbox.AudioParam);
            done();
        });
        it("should have a playbackRate parameter", function (done) {
            assert.ok(node.playbackRate.constructor === sandbox.AudioParam);
            done();
        });
        it("should set the buffer using .buffer = buffer", function (done) {
            node.buffer = buffer;
            assert.ok(node.buffer === buffer);
            done();
        });
        it("loop should be false", function (done) {
            assert.ok(node.loop === false);
            done();
        });
        it(".loop = true should be true", function (done) {
            assert.ok(node.loop = true);
            done();
        });
        it("loop should be true", function (done) {
            assert.ok(node.loop === true);
            done();
        });
        it(".loop = false should be false", function (done) {
            assert.ok(node.loop = false === false);
            done();
        });
        it("loopStart should be 0", function (done) {
            assert.equal(node.loopStart, 0);
            done();
        });
        it("loopStart less than 0 should be 0", function (done) {
            node.loopStart = -1;
            assert.equal(node.loopStart, 0);
            done();
        });
        it("calling .start, .stop will trigger onended", function (done) {
            function test() {
                done();
            }
            node.onended = test;
            node.start();
            node.stop();
        });
        it("calling .start, .stop, .start will error", function (done) {
            try {
                node.start();
            } catch (e) {
                assert.ok(e);
                done();
            }
        });
    });
    describe("ScriptProcessor", function () {
        var b = 512,
            i = 2,
            o = 2,
            node;
        it("context.createScriptProcessor should create a ScriptProcessorNode", function (done) {
            node = context.createScriptProcessor(b, i, o);
            assert.ok(node.constructor === sandbox.ScriptProcessorNode);
            done();
        });
        it("onaudioprocess should be null", function (done) {
            assert.ok(node.onaudioprocess === null);
            done();
        });
        it("should send an audio event to onaudioprocess when triggered", function (done) {
            function test(e) {
                assert.equal(e.playbackTime, context.currentTime);
                assert.ok(e.inputBuffer.constructor === sandbox.AudioBuffer);
                assert.ok(e.outputBuffer.constructor === sandbox.AudioBuffer);
            }
            node.onaudioprocess = test;
            node.process();
            done();
        });
    });
    describe("PannerNode", function () {
        var node;
        it("context.createPanner should create a PannerNode", function (done) {
            node = context.createPanner();
            assert.ok(node.constructor === sandbox.PannerNode);
            done();
        });
        it("should have a panning model of \"equalpower\"", function (done) {
            assert.equal(node.panningModel, "equalpower");
            done();
        });
        it("should have a distance model of \"inverse\"", function (done) {
            assert.equal(node.distanceModel, "inverse");
            done();
        });
        it("should have coneInnerAngle", function (done) {
            assert.ok(node.coneInnerAngle);
            done();
        });
        it("should have coneOuterAngle", function (done) {
            assert.ok(node.coneOuterAngle);
            done();
        });
        it("should have coneOuterGain", function (done) {
            assert.ok(node.coneOuterGain !== undefined);
            done();
        });
        it("should have maxDistance", function (done) {
            assert.ok(node.maxDistance);
            done();
        });
        it("should have refDistance", function (done) {
            assert.ok(node.refDistance);
            done();
        });
        it("should have rolloffFactor", function (done) {
            assert.ok(node.rolloffFactor);
            done();
        });
        it("should have setOrientation", function (done) {
            assert.ok(node.setOrientation);
            done();
        });
        it("should have setPosition", function (done) {
            assert.ok(node.setPosition);
            done();
        });
        it("should have setVelocity", function (done) {
            assert.ok(node.setVelocity);
            done();
        });
    });
    describe("SpatialPannerNode", function () {
        var node;
        it("context.createPanner should create a SpatialPannerNode", function (done) {
            node = context.createSpatialPanner();
            assert.ok(node.constructor === sandbox.SpatialPannerNode);
            assert.ok(node.context === context);
            done();
        });
        it("should have a panning model of \"equalpower\"", function (done) {
            assert.equal(node.panningModel, "equalpower");
            done();
        });
        it("should have a distance model of \"inverse\"", function (done) {
            assert.equal(node.distanceModel, "inverse");
            done();
        });
        it("should have coneInnerAngle", function (done) {
            assert.ok(node.coneInnerAngle);
            done();
        });
        it("should have coneOuterAngle", function (done) {
            assert.ok(node.coneOuterAngle);
            done();
        });
        it("should have coneOuterGain", function (done) {
            assert.ok(node.coneOuterGain !== undefined);
            done();
        });
        it("should have maxDistance", function (done) {
            assert.ok(node.maxDistance);
            done();
        });
        it("should have refDistance", function (done) {
            assert.ok(node.refDistance);
            done();
        });
        it("should have rolloffFactor", function (done) {
            assert.ok(node.rolloffFactor);
            done();
        });
    });
    describe("StereoPannerNode", function () {
        var node;
        it("context.createStereoPanner should return a StereoPannerNode", function (done) {
            node = context.createStereoPanner();
            assert.ok(node.constructor === sandbox.StereoPannerNode);
            done();
        });
        it("StereoPannerNode should have an AudioParam called pan", function (done) {
            assert.ok(node.pan.constructor === sandbox.AudioParam);
            done();
        });
        it("node.pan should have a value of 0", function (done) {
            assert.equal(node.pan.value, 0);
            done();
        });
    });
    describe("ConvolverNode", function () {
        var node;
        it("context.createConvolver should return a ConvolverNode", function (done) {
            node = context.createConvolver();
            assert.ok(node.constructor === sandbox.ConvolverNode);
            done();
        });
        it("ConvolverNode.buffer should be null", function (done) {
            assert.equal(node.buffer, null);
            done();
        });
        it("ConvolverNode.normalise should be false", function (done) {
            assert.equal(node.normalise, false);
            done();
        });
        it("should accept a buffer with 1 channel", function (done) {
            var buffer = context.createBuffer(1, 1024, context.sampleRate);
            node.buffer = buffer;
            assert.ok(node.buffer === buffer);
            done();
        });
        it("should accept a buffer with 2 channels", function (done) {
            var buffer = context.createBuffer(2, 1024, context.sampleRate);
            node.buffer = buffer;
            assert.ok(node.buffer === buffer);
            done();
        });
        it("should accept a buffer with 4 channels", function (done) {
            var buffer = context.createBuffer(4, 1024, context.sampleRate);
            node.buffer = buffer;
            assert.ok(node.buffer === buffer);
            done();
        });
        it("should not accept a buffer with 3 channels", function (done) {
            var buffer = context.createBuffer(3, 1024, context.sampleRate);
            try {
                node.buffer = buffer;
            } catch (e) {
                assert.equal(node.buffer, null);
                done();
            }
        });
    });
    describe("AnalyserNode", function () {
        var node;
        it("context.createAnalyser should return an AnalyserNode", function (done) {
            node = context.createAnalyser();
            assert.ok(node.constructor === sandbox.AnalyserNode);
            done();
        });
        it("should have an fftSize of 2048", function (done) {
            assert.equal(node.fftSize, 2048);
            done();
        });
        it("should have a frequencyBinCount of half the fftSize", function (done) {
            assert.equal(node.frequencyBinCount, node.fftSize / 2);
            done();
        });
        it("should have .getByteFrequencyData", function (done) {
            assert.ok(node.getByteFrequencyData);
            done();
        });
        it("should have .getByteTimeDomainData", function (done) {
            assert.ok(node.getByteTimeDomainData);
            done();
        });
        it("should have .getFloatFrequencyData", function (done) {
            assert.ok(node.getFloatFrequencyData);
            done();
        });
        it("should have .getFloatTimeDomainData", function (done) {
            assert.ok(node.getFloatTimeDomainData);
            done();
        });
    });
});
