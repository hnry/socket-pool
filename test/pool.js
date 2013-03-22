var Pool = require('../index')
  , net = require('net')
  , Socket = net.Socket
  , should = require('should');

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
        pool.available.length.should.equal(5);
        done();
      }, 40);
    });

    it('defaults', function() {
      pool.min.should.equal(5);
      pool.max.should.equal(10);
      pool.servers['localhost:3001'].weight.should.equal(1);
      should.exist(pool.sockets['localhost:3001']);
      should.exist(pool.available);
    });
  });

  describe('aquire', function() {
    it('returns available socket if any', function() {
      var pool2 = new Pool([{}], {min: 0});
      var socket = pool2.aquire();
      should.not.exist(socket);
      pool2.available.unshift({a: 'test'});
      socket = pool2.aquire();
      socket.should.eql({a: 'test'});
    });
  });

  describe('add', function() {
    // we make sure the socket is good first
    it.skip('a socket to available pool', function() {

    });
  });

  describe('queue', function() {
    beforeEach(function() {
      pool._queue = [];
    });

    it('adds to _queue', function() {
      pool.queue(function(socket) {});
      pool._queue.should.have.lengthOf(1);
    });

    it('has a length', function() {
      pool._queue.length.should.have.lengthOf(0);
    });

    it('fn that will be called on next available socket', function(done) {
      var socket = new Socket();
      socket.connect(3001, '127.0.0.1');
      socket.once('connect', function() {
        pool.queue(function(socket) {
          done();
        });
        pool.add(socket);
      });
    });
  });

  describe('_available', function() {

  });

  describe('_recommend', function() {
    beforeEach(function() {
      pool = new Pool([
        {host: '127.0.0.1', port: 3001, weight: 10},
        {host: '127.0.0.1', port: 3002, weight: 5},
        {host: '127.0.0.1', port: 3003, weight: 2},
        {host: '127.0.0.1', port: 3004, weight: 1}
      ], { min: 0, max: 20 });
    });

    it('the server most in need', function() {
      var server = pool._recommend();
      server.port.should.be.equal(3001);
      pool.sockets[server.host + ':' + server.port].blah = {};
      
      server = pool._recommend();
      server.port.should.be.equal(3002);
  });

    it('maintains proportions', function() {
      var server = pool._recommend();
      server.port.should.be.equal(3001);
      for (var i = 0; i < pool.max; i++) {
        server = pool._recommend();
        pool.sockets[server.host + ':' + server.port]['i' + i] = {};
      }
      Object.keys(pool.sockets['127.0.0.1:3001']).length.should.equal(11);
      Object.keys(pool.sockets['127.0.0.1:3002']).length.should.equal(6);
      Object.keys(pool.sockets['127.0.0.1:3003']).length.should.equal(2);
      Object.keys(pool.sockets['127.0.0.1:3004']).length.should.equal(1);
    });

    it('maximum is already met, it still recommends', function() {
      var server = pool._recommend();
      server.port.should.be.equal(3001);

      // fake add sockets to reach max
      for (var i = 0; i < pool.max; i++) {
        pool.sockets[server.host + ':' + server.port]['i' + i] = {};
      }
      server = pool._recommend();
      server.port.should.be.equal(3002);

      // fake add sockets to reach max
      for (var i = 0; i < pool.max; i++) {
        pool.sockets[server.host + ':' + server.port]['i' + i] = {};
        pool.sockets[server.host + ':3003']['i' + i] = {};
      }
      server = pool._recommend();
      server.port.should.be.equal(3001);
    })
  });

  describe('_ensure', function() {
    it('only creates socket if minimum is not met');
    it('only creates socket if maximum is not met');
    it('adds successful sockets only to pool');
  });

});