// add a way to expire sockets from the pool when the pool hasn't heard from the socket in a long time
var Socket = require('net').Socket;

module.exports = function(s) {
  s.release = function() {

  }

  s._on = s.on;

  s._on('error', function(err) {

  });

  s._on('close', function(err) {

  });

  s._on('end', function(err) {

  });

  s._on('timeout', function(err) {

  });

  s.on = function() {
    return 'test';
  }
}