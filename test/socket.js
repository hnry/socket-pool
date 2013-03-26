var PSocket = require('../lib/socket')
  , net = require('net')
  , Socket = net.Socket
  , Pool = require('../lib/pool')
  , should = require('should');


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
    it('socket back into the pool');

    it('removes all events and flushes the socket');

    it('checks socket before releasing back into pool');
  });

});