var Pool = require('../index.js')
  , should = require('should')
  , http = require('http');


var connectCounter = 0;

var server = http.createServer(function(req, res) {
  res.write('heres a response').end();
}).listen(3001);


describe('socket pooling', function() {

  beforeEach(function() {
    connectCounter = 0;
  })

  after(function() {
    server.close();
  });

  /*
   *  Simple test to start a default pool
   *  and get a socket and write and get data
   */
  it('simple pooling', function(done) {
    var pool = new Pool([
      {host: '127.0.0.1', port: 3001}
    ], {
      min: 5,
      max: 10
    });
    server.on('connection', function() {
      connectCounter++;
      // we got a socket available
      var socket = pool.acquire();
      should.exist(socket);
      if (connectCounter === 5) {
        socket.on('data', function(data) {
          data.should.equal('heres a response');
          done();
        });
        socket.write('GET / HTTP/1.1\r\n\r\n');
      }
      socket.release();
    })
  })

});