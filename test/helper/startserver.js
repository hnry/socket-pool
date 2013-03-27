var net = require('net');
var prange = [3001, 9000];


var port = prange[0];
var servers = {};

module.exports = function(cnt, fn) {
  port++;

  cnt = cnt || null;
  var count = 0;
  var server = net.createServer(function(socket) {
    socket.on('data', function(data) {});
    count++;
    if (count === cnt) fn();
  }).listen(port);
  servers[port] = server;
  return port;
}