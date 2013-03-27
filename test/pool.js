var Pool = require('../index')
  , net = require('net')
  , Socket = net.Socket
  , should = require('should')
  , intercept = require('intercept.js');

var startServer = require('./helper/startserver');

describe('Pool', function() {

  describe('initialize', function() {
    var pool, port;

    before(function(done) {
      port = startServer(5, function() { done(); });
      pool = new Pool([
        { host: '127.0.0.1', port: port }
      ]);
    })

    it('creates min sockets', function() {
      // by default the min is 5
      pool.available.length.should.equal(5);
    });

    it('defaults', function() {
      pool.min.should.equal(5);
      pool.max.should.equal(10);
      pool.servers['127.0.0.1:'+port].weight.should.equal(1);
      should.exist(pool.sockets['127.0.0.1:'+port]);
      should.exist(pool.available);
    });

    it('sockets length', function() {
      pool.sockets.length().should.be.equal(5);
      pool.sockets['127.0.0.1:'+port]['blah1'] = {};
      pool.sockets['127.0.0.1:'+port]['blah2'] = {};
      pool.sockets.length().should.be.equal(7);
      delete(pool.sockets['127.0.0.1:'+port]['blah1']);
      delete(pool.sockets['127.0.0.1:'+port]['blah2']);
    });

  });


  describe('_available', function() {
    // acquire needs to do this too
    it('maintains minimum sockets, calls _ensure');
  });

  describe('drain', function() {
    it('closes all sockets in the Pool and the Pool itself');
  });

  describe('_ensure', function() {
    var pool, port;

    before(function(done) {
      port = startServer(1, function() { done(); });
      pool = new Pool([
        { host: '127.0.0.1', port: port }
      ], {
        min: 1
      });
    })

    it('only creates socket if minimum is not met', function() {
      var pool = new Pool([{ host: '127.0.0.1', port: port }], {min: 2, max: 10});
      // create minimum
      pool.available.unshift({});
      pool.available.unshift({});
      var result = intercept(Pool.prototype, Pool.prototype._recommend);
      pool._ensure();
      result().should.equal(false);
      pool._recommend(); // reset
    });

    it('only creates socket if maximum is not met', function() {
      var pool = new Pool([{ host: '127.0.0.1', port: port }], {min: 1, max: 2});

      // just to test this works when it's suppose to
      var result = intercept(Pool.prototype, Pool.prototype._recommend);
      try {
        pool._ensure();
      } catch(e) {
        result().called.should.equal(true);
      }

      for (var i = 0; i < 5; i++) {
        pool.sockets['127.0.0.1:'+port]['i' + i] = {};
      }
      result = intercept(Pool.prototype, Pool.prototype._recommend);
      pool._ensure();
      result().should.equal(false);
      pool._recommend(); // reset
    });

    it('delays creating sockets for a certain host if repeated errors');
  });


  describe('acquire', function() {
    var pool, port;

    before(function(done) {
      port = startServer(1, function() { done(); });
      pool = new Pool([
        { host: '127.0.0.1', port: port }
      ], {
        min: 1
      });
    })

    it('returns available socket if any', function() {
      var socket = pool.acquire();
      should.exist(socket);

      socket = pool.acquire();
      should.not.exist(socket);
    });
  });


  describe('add', function() {
    var pool, port;

    before(function(done) {
      port = startServer(5, function() { done(); });
      pool = new Pool([
        { host: '127.0.0.1', port: port }
      ]);
    })

    it('rejects bad sockets', function() {
      pool.available.length.should.equal(5);

      var socket, result;
      socket = {};
      result = pool.add(socket);
      result.should.equal(false);
      pool.available.length.should.equal(5);

      // it expects the socket to be connected
      socket = new Socket();
      result = pool.add(socket);
      result.should.equal(false);
      pool.available.length.should.equal(5);
    });

    it('a socket to available pool', function(done) {
      var socket = new Socket();
      socket.connect(port, '127.0.0.1');
      socket.once('connect', function() {
        this._testing = 123;
        var result = pool.add(this);
        result.should.equal(true);
        pool.available[0]._testing.should.equal(123);
        done();
      });
    });
  });


  describe('queue', function() {
    var pool, port;

    before(function(done) {
      port = startServer(1, function() { done(); });
      pool = new Pool([
        { host: '127.0.0.1', port: port }
      ]);
    })

    beforeEach(function() {
      pool._queue = [];
    });

    it('adds to _queue', function() {
      pool.queue(function(socket) {});
      pool._queue.should.have.lengthOf(1);
    });

    it('has a length', function() {
      pool._queue.length.should.equal(0);
    });

    it('fn that will be called on next available socket', function(done) {
      var socket = new Socket();
      socket.connect(port, '127.0.0.1');
      socket.once('connect', function() {
        pool.queue(function(socket) {
          done();
        });
        pool.add(socket);
      });
    });
  });


  describe('_recommend', function() {
    var pool, port = [], once = true;

    before(function(done) {
      port[0] = startServer(1, function() { done(); });
      port[1] = startServer();
      port[2] = startServer();
      port[3] = startServer();
      pool = new Pool([
        {host: '127.0.0.1', port: port[0], weight: 10},
        {host: '127.0.0.1', port: port[1], weight: 5},
        {host: '127.0.0.1', port: port[2], weight: 1},
        {host: '127.0.0.1', port: port[3], weight: 2}
      ], { min: 0, max: 20 });
    });

    beforeEach(function() {
      pool = new Pool([
        {host: '127.0.0.1', port: port[0], weight: 10},
        {host: '127.0.0.1', port: port[1], weight: 5},
        {host: '127.0.0.1', port: port[2], weight: 1},
        {host: '127.0.0.1', port: port[3], weight: 2}
      ], { min: 0, max: 20 });
    });

    /*
     *  It should realize the others have 0 and give priority
     */
    it('the server most in need', function() {
      // based on the weight provided servers would then be created in this order
      var recommendations = [port[0], port[1], port[2], port[3], port[0], port[1], port[0], port[0], port[1], port[0], port[0], port[1], port[3]];

      for (var i = 0, l = recommendations.length; i<l; i++) {
        var server = pool._recommend();
        server.port.should.be.equal(recommendations[i]);
        pool.sockets[server.host + ':' + server.port]['i'+i] = {};
      }
    });

    it('maintains proportions', function() {
      var server = pool._recommend();
      server.port.should.be.equal(port[0]);
      for (var i = 0; i < pool.max; i++) {
        server = pool._recommend();
        pool.sockets[server.host + ':' + server.port]['i' + i] = {};
      }
      Object.keys(pool.sockets['127.0.0.1:'+port[0]]).length.should.equal(11);
      Object.keys(pool.sockets['127.0.0.1:'+port[1]]).length.should.equal(6);
      Object.keys(pool.sockets['127.0.0.1:'+port[2]]).length.should.equal(1);
      Object.keys(pool.sockets['127.0.0.1:'+port[3]]).length.should.equal(2);
    });

    it('maximum is already met, it still recommends', function() {
      var server = pool._recommend();
      server.port.should.be.equal(port[0]);

      // fake add sockets to reach max
      for (var i = 0; i < pool.max; i++) {
        pool.sockets[server.host + ':' + server.port]['i' + i] = {};
      }
      server = pool._recommend();
      server.port.should.be.equal(port[1]);

      // fake add sockets to reach max
      for (var i = 0; i < pool.max; i++) {
        pool.sockets[server.host + ':' + server.port]['i' + i] = {};
        pool.sockets[server.host + ':' + port[2]]['i' + i] = {};
      }
      // server port[3] is the lowest, so the pool will keep recommeding port[3]
      for (var i = 0; i < 4; i++) {
        server = pool._recommend();
        server.port.should.be.equal(port[3]);
        pool.sockets[server.host + ':' + server.port]['i' + i] = {};
      }
    })
  });

});