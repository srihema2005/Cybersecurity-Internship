
'use strict';

const fs = require('fs');
const EventEmitter = require('events');
const KEY_CODES = require('./keycodes');

const EVENT_SIZE = 24;       // Linux input event size
const EV_KEY = 1;
const EVENT_TYPES = ['keyup', 'keypress', 'keydown'];

class Keyboard extends EventEmitter {
  constructor(device = 'event0') {
    super();
    this.device = device;

    this.stream = fs.createReadStream(`/dev/input/${device}`);
    this.stream.on('data', this.handleData.bind(this));
    this.stream.on('error', err => this.emit('error', err));
  }

  handleData(data) {
    for (let i = 0; i + EVENT_SIZE <= data.length; i += EVENT_SIZE) {
      const buffer = data.slice(i, i + EVENT_SIZE);

      if (buffer.readUInt16LE(16) !== EV_KEY) continue;

      const event = {
        timeS: buffer.readUInt32LE(0),
        timeUS: buffer.readUInt32LE(8),
        keyCode: buffer.readUInt16LE(18),
        keyId: KEY_CODES[buffer.readUInt16LE(18)],
        type: EVENT_TYPES[buffer.readUInt32LE(20)],
        device: this.device
      };

      this.emit(event.type, event);
    }
  }
}

Keyboard.Keys = KEY_CODES;
module.exports = Keyboard;
