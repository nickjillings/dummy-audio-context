# Dummy Audio Context
[![npm version](https://badge.fury.io/js/dummy-audio-context.svg)](https://badge.fury.io/js/dummy-audio-context) [![Build Status](https://travis-ci.org/nickjillings/dummy-audio-context.svg?branch=master)](https://travis-ci.org/nickjillings/dummy-audio-context)

Use this to simulate the behaviour of the Web Audio API AudioContext in your unit testing suites.

This is itself unit tested against the API specificied behaviours.

Please note this is a STATIC object! Timer based events do not fire (although fork-pull if you think you can do it).