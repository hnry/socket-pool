// add a way to expire sockets from the pool when the pool hasn't heard from the socket in a long time
var Socket = require('net').Socket
  , EventEmitter = require('events').EventEmitter;

function PSocket(socket) {
  EventEmitter.call(this);
  this._socket = socket;

  var props = Object.getOwnPropertyNames(this._socket);
  for (var i = 0, l = props.length; i < l; i++) {
    if (!this[props[i]]) this[props[i]] = this._socket[props[i]];
  }

  var self = this;
  var props = Object.keys(Socket.prototype);
  for (var i = 0, l = props.length; i < l; i++) {
    if (!this[props[i]] && !EventEmitter.prototype[props[i]] && this._socket[props[i]]) this[props[i]] = self._socket[props[i]].bind(self._socket);
  }

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