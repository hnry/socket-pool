var Pool = require('../index')
  , net = require('net')
  , Socket = net.Socket
  , should = require('should')
  , intercept = require('intercept.js');

describe('Pool', function() {
  var pool, testServer;
  testServer = net.createServer().listen(3001);

  beforeEach(function(done) {
    testServer.once('connection', function(socket) {
      done();
    });

    pool = new Pool([
      { host: '127.0.0.1', port: 3001 }
    ]);
  })

  after(function() {
    //testServer.close();
  })

  // Pool init, Pool.add
  it('expects IP addresses');

  describe('initialize', function() {
    it('creates min sockets', function() {
      // by default the min is 5
        pool.available.length.should.equal(5);
    });

    it('defaults', function() {
      pool.min.should.equal(5);
      pool.max.should.equal(10);
      pool.servers['127.0.0.1:3001'].weight.should.equal(1);
      should.exist(pool.sockets['127.0.0.1:3001']);
      should.exist(pool.available);
    });
  });

  describe('acquire', function() {
    it('returns available socket if any', function() {
      var pool2 = new Pool([{}], {min: 0});
      var socket = pool2.acquire();
      should.not.exist(socket);
      pool2.available.unshift({a: 'test'});
      socket = pool2.acquire();
      socket.should.eql({a: 'test'});
    });
  });

  describe('add', function() {
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
      socket.connect(3001, '127.0.0.1');
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
        {host: '127.0.0.1', port: 3003, weight: 1},
        {host: '127.0.0.1', port: 3004, weight: 2}
      ], { min: 0, max: 20 });
    });

    /*
     *  It should realize the others have 0 and give priority
     */
    it('the server most in need', function() {
      var server = pool._recommend();
      server.port.should.be.equal(3001);
      pool.sockets[server.host + ':' + server.port].blah = {};
      
      server = pool._recommend();
      server.port.should.be.equal(3002);
      pool.sockets[server.host + ':' + server.port].blah = {};

      server = pool._recommend();
      server.port.should.be.equal(3004);
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
      Object.keys(pool.sockets['127.0.0.1:3003']).length.should.equal(1);
      Object.keys(pool.sockets['127.0.0.1:3004']).length.should.equal(2);
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
    it('only creates socket if minimum is not met', function() {
      var pool2 = new Pool([{ host: '127.0.0.1', port: 3001 }], {min: 2, max: 10});
      // create minimum
      pool2.available.unshift({});
      pool2.available.unshift({});
      var result = intercept(Pool.prototype, Pool.prototype._recommend);
      pool2._ensure();
      result().should.equal(false);
      pool2._recommend(); // reset
    });

    it('only creates socket if maximum is not met', function() {
      var pool2 = new Pool([{ host: '127.0.0.1', port: 3001 }], {min: 1, max: 2});

      // just to test this works when it's suppose to
      var result = intercept(Pool.prototype, Pool.prototype._recommend);
      try {
        pool2._ensure();
      } catch(e) {
        result().called.should.equal(true);
      }

      for (var i = 0; i < 5; i++) {
        pool2.sockets['127.0.0.1:3001']['i' + i] = {};
      }
      result = intercept(Pool.prototype, Pool.prototype._recommend);
      pool2._ensure();
      result().should.equal(false);
      pool2._recommend(); // reset
    });

    it('blacklists creating sockets for a certain host if repeated errors');
  });

  describe('length', function() {
    it('returns number of all sockets in the Pool');
  });

  describe('drain', function() {
    it('closes all sockets in the Pool and the Pool itself');
  });

});