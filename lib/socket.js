var Socket = require('net').Socket
  , EventEmitter = require('events').EventEmitter
  , util = require('./util.js');

/*
 *  This is useful for getter properties that don't exist
 *  during initialization
 */
function defgetter(prop) {
  this.__defineGetter__(prop, function() { return this._socket[prop]; });
}

function defsetter(prop) {
  this[prop] = function() {
    if (this._socket && this._socket[prop]) {
      switch (arguments.length) {
        case 0:
          return this._socket[prop].call(this._socket);
        case 1:
          return this._socket[prop].call(this._socket, arguments[0]);
        case 2:
          return this._socket[prop].call(this._socket, arguments[0], arguments[1]);
        case 3:
          return this._socket[prop].call(this._socket, arguments[0], arguments[1], arguments[2]);
        default:
          return this._socket[prop].apply(this._socket, Array.prototype.slice.call(arguments));
      }
    }
  }
}

function PSocket(socket) {
  EventEmitter.call(this);
  this._socket = socket;
  var self = this;
  this._socket._psocket = this;

  if (this._events === null) this._events = {}; // 0.8 compat

  // expose net.Socket
  var props = Object.getOwnPropertyNames(this._socket);
  for (var i = 0, l = props.length; i < l; i++) {
    if (!this[props[i]]) this[props[i]] = this._socket[props[i]];
  }

  var props = Object.getOwnPropertyNames(Socket.prototype);
  for (var i = 0, l = props.length; i < l; i++) {
    var sockprop = props[i];

    if (!this[sockprop] && !EventEmitter.prototype[sockprop] && this._socket[sockprop]) {
        if (typeof self._socket[sockprop] === 'function') {
          defsetter.call(self, sockprop);
        } else {
          this[sockprop] = self._socket[sockprop];
        }
    }
  }

  defsetter.call(this, 'setEncoding');
  defgetter.call(this, 'bufferSize');
  this.bytesRead = function() { return this._socket.bytesRead; }
}

PSocket.prototype = Object.create(EventEmitter.prototype);

PSocket.prototype.release = function() {
  var self = this;
  if (this._socket.bufferSize !== 0) {
    this._socket.on('drain', function() {
      self.release();
    });
    return;
  }
  util.removeEvents(this);
  this._socket._psocket = false;
  this._socket._pool._available(self._socket);
  this._socket = null;
}

module.exports = PSocket;
