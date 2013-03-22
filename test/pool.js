var Pool = require('../index')
  , net = require('net')
  , Socket = net.Socket
  , assert = require('assert');

var testServer = net.createServer(3001);

var pool;
describe('Pool', function() {

  before(function() {
    pool = new Pool([
      { host: 'localhost', port: 3001 }
    ]);
  })

  describe('initialize', function() {
    it('creates min sockets', function(done) {
      // by default the min is 5
      setTimeout(function() {
        assert.strictEqual(pool.available.length, 5);
        done();
      }, 40);
    });

    it('defaults', function() {
      assert.strictEqual(pool.min, 5);
      assert.strictEqual(pool.max, 10);
      assert.strictEqual(pool.servers['localhost:3001'].weight, 1);
      assert.ok(pool.sockets['localhost:3001']);
      assert.ok(pool.available);
    });
  });

  describe('aquire', function() {
    it('returns available socket if any', function() {
      var pool2 = new Pool([{}], {min: 0});
      var socket = pool2.aquire();
      assert.equal(socket, undefined);
      pool2.available.unshift({a: 'test'});
      socket = pool2.aquire();
      assert.deepEqual(socket, {a: 'test'});
    });
  });

  describe('add', function() {
    // we make sure the socket is good first
    it.skip('a socket to available pool', function() {

    });
  });

  describe('queue', function() {
    it('fn that will be called on next available socket');
  });

  describe('_available', function() {

  });

  describe('_recommend', function() {
    it('picks the server most in need', function() {
      var p = new Pool([
        {host: '127.0.0.1', port: 3001, weight: 10},
        {host: '127.0.0.1', port: 3002, weight: 5},
        {host: '127.0.0.1', port: 3003, weight: 2},
        {host: '127.0.0.1', port: 3004, weight: 1}
      ], { min: 0, max: 20 });

      var server = p._recommend();
      assert.strictEqual(server.port, 3001);
      // fake add a socket to the server
      p.sockets[server.host + ':' + server.port].blah = {};
      server = p._recommend();
      assert.strictEqual(server.port, 3002);
    });

    it('maximum is already met, it still recommends')
  });

  describe('_ensure', function() {
    it('only creates socket if minimum is not met');
    it('only creates socket if maximum is not met');
    it('adds successful sockets only to pool');
  });

});