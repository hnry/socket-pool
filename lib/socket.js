// add a way to expire sockets from the pool when the pool hasn't heard from the socket in a long time
var Socket = require('net').Socket
  , EventEmitter = require('events').EventEmitter;

function PSocket(socket) {
  EventEmitter.call(this);
  this._socket = socket;

  var self = this;

  // expose net.Socket
  var props = Object.getOwnPropertyNames(this._socket);
  for (var i = 0, l = props.length; i < l; i++) {
    if (!this[props[i]]) this[props[i]] = this._socket[props[i]];
  }

  var props = Object.getOwnPropertyNames(Socket.prototype);
  for (var i = 0, l = props.length; i < l; i++) {
    if (!this[props[i]] && !EventEmitter.prototype[props[i]] && this._socket[props[i]]) {
        if (typeof self._socket[props[i]] === 'function') {
          this[props[i]] = self._socket[props[i]].bind(self._socket);
        } else {
          this[props[i]] = self._socket[props[i]];
        }
    }
  }
  // expose some things instead of going up the prototype tree with socket
  this.setEncoding = this._socket.setEncoding.bind(this._socket);
  this.bufferSize = function() { return this._socket.bufferSize; }
  this.bytesRead = function() { return this._socket.bytesRead; }

  this._socket.on('error', function(e) {
    self.emit('error', e);
  });
  this._socket.on('close', function() {
    self.emit('close');
  });
  this._socket.on('timeout', function() {
    self.emit('timeout')
  });
  this._socket.on('end', function() {
    self.emit('end');
  });

  this._socket.on('data', function(data) {
    self.emit('data', data);
  });
}

PSocket.prototype = Object.create(EventEmitter.prototype);

PSocket.prototype.release = function() {

}

module.exports = PSocket;