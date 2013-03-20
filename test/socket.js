var PSocket = require('../lib/socket')
  , net = require('net')
  , Socket = net.Socket
  , assert = require('assert');

describe('Socket', function() {

  it('exposes socket events', function() {
    var p = new Pool([{host: '127.0.0.1', port: 3001}]);
    var sock = new Socket();
  });

  describe('release', function() {
    // after the socket is deemed good
    it('socket back into the pool');
  });

});