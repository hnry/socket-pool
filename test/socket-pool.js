var Pool = require('../index.js')
  , should = require('should')
  , http = require('http');

describe('socket pooling', function() {
  var connectCounter = 0;
  var pool;
  var server;

  before(function() {
    server = http.createServer(function(req, res) {
      res.write('heres a response');
      res.end();
    }).listen(3100);
  });

  beforeEach(function() {
    connectCounter = 0;
  })

  /*
   *  Simple test to start a default pool
   *  and get a socket and write and get data
   */
  it('simple pooling', function(done) {
    pool = new Pool([
      {host: '127.0.0.1', port: 3100}
    ], {
      min: 2,
      max: 7
    });
    server.on('connection', function() {
      connectCounter++;
      if (connectCounter === 2) {
        // we got a socket available
        var socket = pool.acquire();
        should.exist(socket);
        socket.setEncoding('utf8');
        socket.on('data', function(data) {
          data.should.match(/heres a response/);
          socket.release();
          done();
        });
        socket.write('GET / HTTP/1.1\r\n\r\n');
      }
    })
  })

});