/*globals DOMException, Float32Array, Event, Promise, ArrayBuffer */
var AudioNode = function (context, channels, numberOfInputs, numberOfOutputs) {
    var connectionMap = [],
        channelCountMode = "max",
        channelInterpretation = "discrete";

    function checkForConnection(destination, output, input) {
        return (connectionMap.findIndex(function (e) {
            return (e.destination === destination && e.output === output && e.input === input);
        })) !== -1;
    }

    function addConnection(destination, output, input) {
        connectionMap.push({
            destination: destination,
            output: output,
            input: input
        });
    }

    function removeConnection(destination, output, input) {
        var i = connectionMap.findIndex(function (e) {
            return (e.destination === destination && e.output === output && e.input === input);
        });
        connectionMap.splice(i, 1);
    }

    Object.defineProperties(this, {
        "context": {
            "value": context
        },
        "channelCount": {
            "value": channels
        },
        "channelCountMode": {
            "get": function () {
                return channelCountMode;
            }
        },
        "channelInterpretation": {
            "get": function () {
                return channelInterpretation;
            }
        },
        "numberOfInputs": {
            "value": numberOfInputs
        },
        "numberOfOutputs": {
            "value": numberOfOutputs
        },
        "connect": {
            "value": function (destination, output, input) {
                if (output === undefined) {
                    output = 0;
                }
                if (input === undefined) {
                    input = 0;
                }
                if (destination.context) {
                    if (destination.context !== context) {
                        return new Error("Not from the same audio context");
                    }
                } else if (destination.value) {
                    if (destination.node.context !== context) {
                        return new Error("Not from the same audio context");
                    }
                } else {
                    throw ("Not an AudioNode or AudioParam");
                }

                if (output < 0 || output > numberOfOutputs) {
                    return new DOMException("IndexSizeError");
                }
                if (input < 0 || input > numberOfInputs) {
                    return new DOMException("IndexSizeError");
                }
                if (checkForConnection(destination, output, input) === false) {
                    addConnection(destination, output, input);
                }
                return destination;
            }
        },
        "disconnect": {
            "value": function (destination, output, input) {
                if (output === undefined) {
                    output = 0;
                }
                if (input === undefined) {
                    input = 0;
                }
                if (output < 0 || output > numberOfOutputs) {
                    return new DOMException("IndexSizeError");
                }
                if (input < 0 || input > numberOfInputs) {
                    return new DOMException("IndexSizeError");
                }
                if (checkForConnection(destination, output, input) === false) {
                    throw ("InvalidAccessError: A parameter of an operation is not supported by the underlying object");
                }
                removeConnection(destination, output, input);
            }
        },
        "connectedTo": {
            "value": function (node) {
                var i, a;
                for (i = 0; i < connectionMap.length; i++) {
                    a = connectionMap[i];
                    if (a.destination === node || a.destination.node === node) {
                        return true;
                    } else {
                        if (a.destination !== context.destination && a.destination !== this) {
                            if (a.destination.connectedTo) {
                                if (a.destination.connectedTo(node)) {
                                    return true;
                                }
                            } else if (a.destination.node.connectedTo) {
                                if (a.destination.node.connectedTo(node)) {
                                    return true;
                                }
                            }
                        }
                    }
                }
                return false;
            }
        },
        "getDestinations": {
            "value": function () {
                var list = [];
                connectionMap.forEach(function (a) {
                    list.push(a.destination);
                });
                return list;
            }
        }
    });
};

var AudioParam = function (node, defaultValue, minValue, maxValue) {
    var value = defaultValue;

    function vt(v, t) {
        if (v === undefined || t === undefined) {
            throw ("Not enough arguments to AudioParam.setTargetAtTime.");
        }
        if (typeof v !== "number" || typeof t !== "number") {
            throw ("TypeError: Value being assigned to AudioParam.value is not a finite floating-point value.");
        }
        return this;
    }
    Object.defineProperties(this, {
        "node": {
            "value": node
        },
        "value": {
            "get": function () {
                return value;
            },
            "set": function (v) {
                if (typeof v !== "number") {
                    throw ("TypeError: Value being assigned to AudioParam.value is not a finite floating-point value.");
                }
                if (minValue) {
                    v = Math.max(v, minValue);
                }
                if (maxValue) {
                    v = Math.min(v, maxValue);
                }
                value = v;
                return this.value;
            }
        },
        "defaultValue": {
            "value": defaultValue
        },
        "minValue": {
            "value": minValue
        },
        "maxValue": {
            "value": maxValue
        },
        "setValueAtTime": {
            "value": vt
        },
        "linearRampToValueAtTime": {
            "value": vt
        },
        "exponentialRampToValueAtTime": {
            "value": vt
        },
        "setTargetAtTime": {
            "value": function (v, s, t) {
                if (v === undefined || s === undefined || t === undefined) {
                    throw ("Not enough arguments to AudioParam.setTargetAtTime.");
                }
                if (typeof v !== "number" || typeof s !== "number" || typeof t !== "number") {
                    throw ("TypeError: Value being assigned to AudioParam.value is not a finite floating-point value.");
                }
                return this;
            }
        },
        "setValueCurveAtTime": {
            "value": function (c, s, t) {
                if (c === undefined || s === undefined || t === undefined) {
                    throw ("Not enough arguments to AudioParam.setTargetAtTime.");
                }
                if (c.constructor !== Float32Array) {
                    throw ("Argument 1 is not a Float32Array");
                }
                if (typeof s !== "number" || typeof t !== "number") {
                    throw ("TypeError: Value being assigned to AudioParam.value is not a finite floating-point value.");
                }
                return this;
            }
        },
        "cancelScheduledValues": {
            "value": function (t) {
                if (t === undefined) {
                    throw ("TypeError: Not enough arguments to AudioParam.cancelScheduledValues.");
                }
                if (typeof t !== "number") {
                    throw ("TypeError: Argument 1 of AudioParam.cancelScheduledValues is not a finite floating-point value.");
                }
                return this;
            }
        }
    });
};

var GainNode = function (context) {
    AudioNode.call(this, context, context.destination.numberOfChannels, 1, 1);
    var gain = new AudioParam(this, 1.0, -Infinity, +Infinity);
    Object.defineProperties(this, {
        "gain": {
            "value": gain
        }
    });
};

var DelayNode = function (context, maxDelayTime) {
    if (maxDelayTime === undefined || typeof maxDelayTime !== "number" || maxDelayTime <= 0) {
        maxDelayTime = Infinity;
    }
    AudioNode.call(this, context, context.destination.numberOfChannels, 1, 1);
    var delayTime = new AudioParam(this, 0, 0, maxDelayTime);
    Object.defineProperties(this, {
        "delayTime": {
            "value": delayTime
        }
    });
};

var AudioBuffer = function (context, numberOfChannels, length, sampleRate) {
    var data = new Float32Array(sampleRate * length * numberOfChannels);
    Object.defineProperties(this, {
        "sampleRate": {
            "value": sampleRate
        },
        "length": {
            "value": length
        },
        "numberOfChannels": {
            "value": numberOfChannels
        },
        "duration": {
            "value": length / sampleRate
        },
        "copyFromChannel": {
            "value": function (destination, channelNumber, startInChannel) {
                if (destination.constructor !== Float32Array) {
                    throw ("Destination must be a Float32Array");
                }
                if (typeof channelNumber !== "number" || channelNumber < 0 || channelNumber !== Math.floor(channelNumber)) {
                    throw ("Channel number not an integer");
                }
                if (channelNumber >= numberOfChannels) {
                    return new DOMException("IndexSizeError");
                }
                if (startInChannel === undefined) {
                    startInChannel = 0;
                }
                if (startInChannel >= length || startInChannel < 0 || startInChannel !== Math.floor(startInChannel)) {
                    throw ("startInChannel not correct");
                }
                var N = math.min(length - startInChannel, destination.length);
                for (var i = 0; i < N; i++) {
                    destination[i] = data[channelNumber * length + startInChannel + i];
                }
            }
        },
        "copyToChannel": {
            "value": function (source, channelNumber, startInChannel) {
                if (source.constructor !== Float32Array) {
                    throw ("Destination must be a Float32Array");
                }
                if (typeof channelNumber !== "number" || channelNumber < 0 || channelNumber !== Math.floor(channelNumber)) {
                    throw ("Channel number not an integer");
                }
                if (channelNumber >= numberOfChannels) {
                    return new DOMException("IndexSizeError");
                }
                if (startInChannel === undefined) {
                    startInChannel = 0;
                }
                if (startInChannel >= length || startInChannel < 0 || startInChannel !== Math.floor(startInChannel)) {
                    throw ("startInChannel not correct");
                }
                var N = math.min(length - startInChannel, source.length);
                for (var i = 0; i < N; i++) {
                    data[channelNumber * length + startInChannel + i] = source[i];
                }
            }
        },
        "getChannelData": {
            "value": function (channelNumber) {
                var ar = new Float32Array(length);
                for (var i = 0; i < length; i++) {
                    ar[i] = data[channelNumber * length + i];
                }
                return ar;
            }
        }
    });
};

var AudioBufferSourceNode = function (context) {
    var loop = false,
        detune = new AudioParam(this, 0, -1200, +1200),
        playbackRate = new AudioParam(this, 1, -Infinity, Infinity),
        loopStart = undefined,
        loopEnd = undefined,
        buffer = null,
        onended = undefined,
        state = 0;
    AudioNode.call(this, context, context.destination.numberOfChannels, 0, 1);
    Object.defineProperties(this, {
        "detune": {
            "value": detune
        },
        "playbackRate": {
            "value": playbackRate
        },
        "buffer": {
            "get": function () {
                return buffer;
            },
            "set": function (b) {
                if (b === null || b.constructor === AudioBuffer) {
                    buffer = b;
                }
                loopStart = 0;
                loopEnd = buffer.duration;
                return buffer;
            }
        },
        "loop": {
            "get": function () {
                return loop;
            },
            "set": function (s) {
                if (s === true) {
                    loop = true;
                } else {
                    loop = false;
                }
                return loop;
            }
        },
        "loopStart": {
            "get": function () {
                return loopStart;
            },
            "set": function (t) {
                if (typeof t !== "number") {
                    throw ("Value is not a number");
                }
                var m = 0;
                t = Math.max(t, 0);
                t = Math.min(t, buffer.duration);
                loopStart = Math.floor(t * buffer.sampleRate);
                return loopStart / buffer.sampleRate;
            }
        },
        "loopEnd": {
            "get": function () {
                return loopStart;
            },
            "set": function (t) {
                if (typeof t !== "number") {
                    throw ("Value is not a number");
                }
                var m = 0;
                t = Math.max(t, 0);
                t = Math.min(t, buffer.duration);
                loopEnd = Math.floor(t * buffer.sampleRate);
                return loopEnd / buffer.sampleRate;
            }
        },
        "onended": {
            "get": function () {
                return onended;
            },
            "set": function (f) {
                if (typeof f === "function") {
                    onended = f;
                }
                return onended;
            }
        },
        "start": {
            "value": function (when, offset, duration) {
                if (buffer === null) {
                    throw ("No buffer");
                }
                if (state !== 0) {
                    throw ("Cannot call .start multiple times");
                }
                if (when === undefined) {
                    when = 0;
                }
                if (offset === undefined) {
                    offset = 0;
                }
                if (duration === undefined) {
                    duration = buffer.duration;
                }
                state = 1;
            }
        },
        "stop": {
            "value": function (when) {
                if (buffer === null) {
                    throw ("No buffer");
                }
                if (state === 0) {
                    throw ("Has not been started");
                }
                if (when === undefined) {
                    when = 0;
                }
                state = 2;
                onended();
            }
        }
    });
};

var ScriptProcessorNode = function (context, bufferSize, inputChannels, outputChannels) {
    AudioNode.call(this, Math.max(inputChannels, outputChannels), 1, 1);
    var AudioProcessingEvent = function (context, bufferSize, inputChannels, outputChannels) {
        Object.defineProperties(this, {
            "inputBuffer": {
                "value": context.createBuffer(inputChannels, bufferSize, context.sampleRate)
            },
            "outputBuffer": {
                "value": context.createBuffer(outputChannels, bufferSize, context.sampleRate)
            },
            "playbackTime": {
                "value": context.currentTime
            }
        });
    };

    var onaudioprocess = null;
    Object.defineProperties(this, {
        "onaudioprocess": {
            "get": function () {
                return onaudioprocess
            },
            "set": function (f) {
                if (typeof f === "function") {
                    onaudioprocess = f;
                }
                return onaudioprocess;
            }
        },
        "process": {
            "value": function () {
                if (onaudioprocess) {
                    onaudioprocess.call(this, new AudioProcessingEvent(context, bufferSize, inputChannels, outputChannels));
                }
            }
        }
    });
}

var AudioContext = function (sampleRate) {
    var state = "suspended",
        destination = new AudioNode(this, 2, 1, 0),
        currentTime = 0,
        onstatechangecallback = function () {};

    function onstatechange() {
        var e = new Event();
        onstatechangecallback.call(e);
    }

    if (sampleRate === undefined || typeof sampleRate !== "number") {
        sampleRate = 48000;
    }

    Object.defineProperties(this, {
        "state": {
            "get": function () {
                return state;
            }
        },
        "destination": {
            "value": destination
        },
        "sampleRate": {
            "value": sampleRate
        },
        "currentTime": {
            "get": function () {
                return currentTime;
            }
        },
        "suspend": {
            "value": function () {
                return new Promise(function (resolve, reject) {
                    state = "suspended";
                    resolve();
                });
            }
        },
        "resume": {
            "value": function () {
                return new Promise(function (resolve, reject) {
                    state = "running";
                    resolve();
                });
            }
        },
        "close": {
            "value": function () {
                return new Promise(function (resolve, reject) {
                    state = "closed";
                    resolve();
                });
            }
        },
        "onstatechange": {
            "get": function () {
                return onstatechangecallback;
            },
            "set": function (f) {
                if (typeof f === "function") {
                    f = onstatechangecallback;
                }
                return onstatechangecallback;
            }
        },
        "decodeAudioData": {
            "value": function (a, onsuccess, onerror) {
                var f = new Float32Array(1024),
                    e;
                if (onsuccess === undefined && onerror === undefined) {
                    return new Promise(function (resolve, reject) {
                        if (a.constructor !== ArrayBuffer) {
                            e = new DOMException('NotSupportedError');
                            reject(e);
                        } else {
                            resolve(f);
                        }
                    });
                } else {
                    if (a.constructor !== ArrayBuffer) {
                        e = new DOMException('NotSupportedError');
                        if (onerror) {
                            onerror(e);
                        }
                    } else {
                        onsuccess(f);
                    }
                    return;
                }
            }
        },
        "createGain": {
            "value": function () {
                return new GainNode(this);
            }
        },
        "createDelay": {
            "value": function () {
                return new DelayNode(this);
            }
        },
        "createBuffer": {
            "value": function (numberOfChannels, length, sampleRate) {
                return new AudioBuffer(this, numberOfChannels, length, sampleRate);
            }
        },
        "createBufferSource": {
            "value": function () {
                return new AudioBufferSourceNode(this);
            }
        },
        "createScriptProcessor": {
            "value": function (bufferSize, numberOfInputChannels, numberOfOutputChannels) {
                return new ScriptProcessorNode(this, bufferSize, numberOfInputChannels, numberOfOutputChannels);
            }
        }
    });
};
