var Pool = require('../index.js')
  , should = require('should')
  , http = require('http');

var server = http.createServer(function(req, res) {

}).listen(3001);


describe('socket pooling', function() {

  afterEach(function() {
    server.removeAllListeners('');
  });

  it.skip('initialize with minimum', function(done) {
    var socketCount = 0;
    server.on('connect', function() {
      socketCount++;
      if (socketCount === 5) done();
    });

    var pool = new Pool([
      {host: '127.0.0.1', port: 3001}
    ], {
      min: 5,
      max: 10
    });
  })

});