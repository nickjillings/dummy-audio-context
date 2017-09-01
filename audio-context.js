/*globals DOMException, Float32Array, Event, Promise, ArrayBuffer */
var AudioNode = function (context, channels, numberOfInputs, numberOfOutputs) {
    var connectionMap = [],
        channelCountMode = "max",
        channelInterpretation = "discrete";

    function checkForConnection(destination, output, input) {
        return (connectionMap.findIndex(function (e) {
            return (e.destination == destination && e.output == output && e.input == input);
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
            return (e.destination == destination && e.output == output && e.input == input);
        });
        connectionMap = connectionMap.splice(i, 1);
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
                if (output < 0 || output > numberOfOutputs) {
                    return new DOMException("IndexSizeError");
                }
                if (input < 0 || input > numberOfInputs) {
                    return new DOMException("IndexSizeError");
                }
                if (checkForConnection(destination, output, input) === true) {
                    return;
                }
                addConnection(destination, output, input);
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
                    throw ("InvalidAccessError: A parameter of an operation is not supported by the underlying object")
                }
                removeConnection(destination, output, input);
            }
        }
    });
};

var AudioParam = function (defaultValue, minValue, maxValue) {
    var _value = defaultValue;

    function vt(v, t) {
        if (v === undefined || t === undefined) {
            throw ("Not enough arguments to AudioParam.setTargetAtTime.");
        }
        if (typeof v != "number" || typeof t != "number") {
            throw ("TypeError: Value being assigned to AudioParam.value is not a finite floating-point value.");
        }
        return this;
    }
    Object.defineProperties(this, {
        "value": {
            "get": function () {
                return _value;
            },
            "set": function (v) {
                if (typeof v != "number") {
                    throw ("TypeError: Value being assigned to AudioParam.value is not a finite floating-point value.");
                }
                _value = v;
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
        "setTargetAtTime ": {
            "value": function (v, s, t) {
                if (v === undefined || s === undefined || t === undefined) {
                    throw ("Not enough arguments to AudioParam.setTargetAtTime.");
                }
                if (typeof v != "number" || typeof s != "number" || typeof t != "number") {
                    throw ("TypeError: Value being assigned to AudioParam.value is not a finite floating-point value.");
                }
                return this;
            }
        },
        "setValueCurveAtTime ": {
            "value": function (c, s, t) {
                if (c === undefined || s === undefined || t === undefined) {
                    throw ("Not enough arguments to AudioParam.setTargetAtTime.");
                }
                if (c.constructor !== Float32Array) {
                    throw ("Argument 1 is not a Float32Array");
                }
                if (typeof s != "number" || typeof t != "number") {
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
                if (typeof t != "number") {
                    throw ("TypeError: Argument 1 of AudioParam.cancelScheduledValues is not a finite floating-point value.");
                }
                return this;
            }
        }
    });
};

var AudioContext = function (sampleRate) {
    var _state = "suspended",
        _destination = new AudioNode(this, 2, 1, 0),
        _currentTime = 0,
        _onstatechangecallback = function () {};

    function onstatechange() {
        var e = new Event();
        _onstatechangecallback.call(e);
    }

    if (sampleRate === undefined || typeof sampleRate != "number") {
        sampleRate = 48000;
    }

    Object.defineProperties(this, {
        "state": {
            "get": function () {
                return _state;
            }
        },
        "destination": {
            "value": _destination
        },
        "sampleRate": {
            "value": sampleRate
        },
        "currentTime": {
            "get": function () {
                return _currentTime;
            }
        },
        "suspend": {
            "value": function () {
                return Promise(function (resolve, reject) {
                    _state = "suspended";
                    resolve();
                });
            }
        },
        "resume": {
            "value": function () {
                return Promise(function (resolve, reject) {
                    _state = "running";
                    resolve();
                });
            }
        },
        "close": {
            "value": function () {
                return Promise(function (resolve, reject) {
                    _state = "closed";
                    resolve();
                });
            }
        },
        "onstatechange": {
            "get": function () {
                return _onstatechangecallback;
            },
            "set": function (f) {
                if (typeof f == "function") {
                    f = _onstatechangecallback;
                }
                return _onstatechangecallback;
            }
        },
        "decodeAudioData": {
            "value": function (a, onsuccess, onerror) {
                var e;
                var f = new Float32Array(1024);
                if (onsuccess === undefined && onerror === undefined) {
                    return new Promise(function (resolve, reject) {
                        if (a.constructor != ArrayBuffer) {
                            e = new DOMException('NotSupportedError');
                            reject(e);
                        } else {
                            resolve(f);
                        }
                    });
                } else {
                    if (a.constructor != ArrayBuffer) {
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
        }
    });
};

var GainNode = function (context) {
    AudioNode.call(this, context, context.destination.numberOfChannels, 1, 1);
    var gain = new AudioParam(1.0, -Infinity, +Infinity);
    Object.defineProperties(this, {
        "gain": {
            "value": gain
        }
    });
};
