var PSocket = require('../lib/socket')
  , net = require('net')
  , Socket = net.Socket
  , assert = require('assert');


var ps;

describe('Socket', function() {

  before(function() {
    var s = new Socket();
    ps = new PSocket(s);
  })

  it('_socket events bubble up', function(done) {
    assert.strictEqual(ps._socket._events.error.length, 1);
    ps.on('error', function(err) {
      done();
    });
    ps.connect();
  });

  it('exposes _socket properties and functions', function() {
    assert.equal(typeof ps.write, 'function');
    assert.equal(typeof ps.connect, 'function');
    assert.equal(typeof ps.end, 'function');
  });

  describe('release', function() {
    // after the socket is deemed good
    it('socket back into the pool');
  });

});