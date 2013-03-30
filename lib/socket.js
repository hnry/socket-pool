var Socket = require('net').Socket
  , EventEmitter = require('events').EventEmitter
  , util = require('./util.js');

function PSocket(socket) {
  EventEmitter.call(this);
  this._socket = socket;
  var self = this;
  this._socket._psocket = this;

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
          this[props[i]] = (function(property) {
            return function() {
            if (self._socket && self._socket[property]) {
              return self._socket[property].apply(self._socket, arguments);
            }
          }})(sockprop)
        } else {
          this[sockprop] = self._socket[sockprop];
        }
    }
  }
  // expose some things instead of going up the prototype tree with socket
  this.setEncoding = this._socket.setEncoding.bind(this._socket);
  this.__defineGetter__('bufferSize', function() { return this._socket.bufferSize; });
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