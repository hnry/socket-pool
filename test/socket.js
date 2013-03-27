var PSocket = require('../lib/socket')
  , net = require('net')
  , Socket = net.Socket
  , Pool = require('../lib/pool')
  , should = require('should');

var startServer = require('./helper/startserver');

describe('Socket', function() {
  var ps, s;

  beforeEach(function() {
    s = new Socket();
    ps = new PSocket(s);
  })

  it('original socket events are maintained', function(done) {
    ps._socket._events.error.length.should.equal(1);
    ps._socket.once('error', function(err) {
      this.emit('error', 'hi')
    });
    ps.on('error', function(err) {
      if (err === 'hi') done();
    });
    ps.connect();
  });

  it('actual socket events bubble up', function(done) {
    ps._socket._events.error.length.should.equal(1);
    ps.on('error', function(err) {
      ps._socket.emit('data', 'hi');
    });
    ps.on('data', function(data) {
      if (data === 'hi') done();
    });
    ps.connect();
  });

  it('is essentially a socket', function(done) {
    var server = net.createServer(function() {
      var socketFns = ['connect', 'write', 'setEncoding', 'end']
      var socketProps = ['bufferSize', 'address', 'bytesRead']

      for (var i = 0, l = socketFns.length; i < l; i++) {
        ps[socketFns[i]].should.be.a('function');
      }

      for (var i = 0, l = socketProps.length; i < l; i++) {
        if (!ps[socketProps[i]]) throw new Error(socketProps[i] + ' does not exist')
      }

      ps.end();
      server.close();
      done();
    }).listen(12001);
    ps.connect(12001, '127.0.0.1');
  });

  /*
   *  Different ways the Socket will try to recover
   */
  describe('recovery', function() {
    it('retries connection')

  });

  describe('release', function() {
    var pool;
    this.timeout(1000000);
    before(function(done) {
      var port = startServer(5, function() { done(); });
      pool = new Pool([
        { host: '127.0.0.1', port: port }
      ]);
    })

    it('socket back into the pool', function() {
      var socket = pool.acquire();
      pool.available.length.should.equal(4);
      socket.release();
      pool.available.length.should.equal(5);
    });

    it('prevents socket from being used after', function() {
      var socket = pool.acquire();
      socket.release();
      var result = socket.write('123');
      result.should.not.equal(true);
    });

    it('removes all events', function() {
      var socket = pool.acquire();
      socket.on('data', function() {});
      Object.keys(socket._events).length.should.equal(1);
      socket._test = 123;
      socket.release();
      pool.available[0]._test.should.equal(123);
      delete(pool.available[0]._test);
      Object.keys(pool.available[0]._events).length.should.equal(0);
    });

    it('waits for socket buffer to empty', function(done) {
      var buf = new Buffer(10000000);
      var socket = pool.acquire();
      socket._test = 45;
      socket.bufferSize().should.equal(0);
      socket.write(buf);
      socket.bufferSize().should.not.equal(0);
      socket.release();
      should.not.exist(pool.available[0]._test);

      var testFn = function(socket) {
        if (socket._test === 45) {
          socket.bufferSize().should.equal(0);
          socket.release();
          done();
        } else {
          pool.queue(testFn);
        }
        socket.release();
      }

      pool.queue(testFn);
    });

    it('checks socket before releasing back into pool');
  });

});