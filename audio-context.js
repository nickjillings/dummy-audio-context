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
                    throw ("Not an AudioNode or AudioParam")
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
                for (var i = 0; i < connectionMap.length; i++) {
                    var a = connectionMap[i];
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
