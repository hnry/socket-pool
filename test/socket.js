var PSocket = require('../lib/socket')
  , net = require('net')
  , Socket = net.Socket
  , Pool = require('../lib/pool')
  , util = require('../lib/util')
  , should = require('should');

var startServer = require('./helper/startserver');

describe('Socket', function() {
  var ps, s;

  beforeEach(function() {
    s = new Socket();
    util.attachEvents(s);
    ps = new PSocket(s);
  })

  // TODO this test needs to be better
  it.skip('original socket events are maintained', function(done) {
    //console.log(ps._socket._events)
    //ps._socket._events.error.length.should.equal(1);
    //ps._socket.once('error', function(err) {
    //  this.emit('error', 'hi')
    //});
    ps.on('error', function(err) {
      if (err.code === 'EADDRNOTAVAIL') done();
    });
    ps.connect();
  });

  it('actual socket events bubble up', function(done) {
    //ps._socket._events.error.length.should.equal(1);
    
    ps.on('error', function(err) {
      s.emit('data', 'hi');
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
        should.exist(ps[socketProps[i]]);
      }

      ps.end();
      server.close();
      done();
    }).listen(12001);
    ps.connect(12001, '127.0.0.1');
  });

  /*
   *  socket recovery is just to remove the socket from the pool
   *  and have it get unref
   */
  describe('recovery', function() {
    it('removes itself from the pool');

  });

  describe('release', function() {
    var pool;
    this.timeout(10000);
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
      var psocket = pool.acquire();
      psocket.release();
      var result = psocket.write('123');
      should.not.exist(result);

      // this is probably ok
      should.exist(psocket.remoteAddress);
    });

    it('removes all events', function() {
      var psocket = pool.acquire();
      // starts out with 6, 1 'readable', the rest attached by
      // util.attachEvents
      Object.keys(psocket._socket._events).length.should.equal(6);

      psocket.on('data', function(data) {});
      psocket.on('error', function(error) {});
      Object.keys(psocket._events).length.should.equal(2);
      psocket._socket._test = 123;
      psocket.release();
      pool.available[0]._test.should.equal(123);
      delete(pool.available[0]._test);
      Object.keys(pool.available[0]._events).length.should.equal(6);
    });

    it('waits for socket buffer to empty', function(done) {
      var buf = new Buffer(10000000);
      var psocket = pool.acquire();
      psocket._socket._test = 45;
      psocket.bufferSize.should.equal(0);
      psocket.write(buf);
      psocket.bufferSize.should.not.equal(0);
      psocket.release();
      should.not.exist(pool.available[0]._test);

      var testFn = function(psocket) {
        if (psocket._socket._test === 45) {
          psocket.bufferSize.should.equal(0);
          psocket.release();
          done();
        } else {
          psocket.release();
          pool.queue(testFn);
        }
      }

      pool.queue(testFn);
    });

    it('checks socket before releasing back into pool');
  });

});