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

  it('is essentially a socket', function() {
    ps.write.should.be.a('function');
    ps.connect.should.be.a('function');
    ps.end.should.be.a('function');
    ps.setEncoding.should.be.a('function');
  });

  /*
   *  Different ways the Socket will try to recover
   */
  describe('recovery', function() {


  });

  describe('release', function() {
    it('socket back into the pool');

    it('removes all events and flushes the socket');

    it('checks socket before releasing back into pool');
  });

});