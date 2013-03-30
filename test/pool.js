var Pool = require('../index')
  , Socket = require('net').Socket
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
      should.exist(pool._sockets['127.0.0.1:'+port]);
      should.exist(pool.available);
    });

    it('sockets length', function() {
      pool.length.should.be.equal(5);
      pool._sockets['127.0.0.1:'+port]['blah1'] = {};
      pool._sockets['127.0.0.1:'+port]['blah2'] = {};
      pool.length.should.be.equal(7);
      delete(pool._sockets['127.0.0.1:'+port]['blah1']);
      delete(pool._sockets['127.0.0.1:'+port]['blah2']);
    });

  });


  describe('_available', function() {
    var pool, port;

    before(function(done) {
      port = startServer(2, function() { done(); });
      pool = new Pool([
        { host: '127.0.0.1', port: port }
      ], {
        min: 2,
        max: 15
      });
    });

    it('acquire maintains minimum sockets', function(done) {
      var socket = pool.acquire();
      pool.available.length.should.equal(1);
      pool.length.should.equal(2);
      function checkAvailable() {
        setTimeout(function() {
          if (pool.available.length === 2) {
            pool.length.should.equal(3);
            socket.release();
            done();
          } else { 
            checkAvailable();
          }
        }, 50);
      };
      checkAvailable();
    });

    it('queue maintains minimum sockets', function(done) {
      pool.min = 1;
      var queue = function() {
        pool.queue(function(sock) {
          if (pool.length > 12) {
            done();
          } else {
            queue();
          }
        });
      };
      queue();
    });
  });

  describe('close', function() {
    var pool, port, port2;

    before(function(done) {
      port = startServer(5, function() { done(); });
      port2 = startServer();
      pool = new Pool([
        { host: '127.0.0.1', port: port },
        { host: '127.0.0.1', port: port2 }
      ], {
        min: 10
      });
    })

    /*
     *  All available sockets should gracefully be let go 
     *  (unref & end)
     *  All busy sockets (out of the pool) will be unref'd and end
     *  on being released back into the pool
     *
     *  That way they are allowed to continue doing their thing
     *  if they are busy in the process of being close()
     *
     *  queue stops processing NEW queued functions
     *
     *  add rejects everything
     *
     *  _recommend & _ensure no longer work
     */
    it('all sockets in the Pool and the Pool itself', function(done) {
      var free = pool.available.length;
      var total = pool.length;
      pool.close();

      pool._drained.should.equal(true);

      // todo, connect this socket
      var socket = new Socket();
      pool.add(socket).should.equal(false);

      pool.available.length.should.equal(0);
      pool.length.should.equal(total - free);

      var server = pool._recommend();
      should.not.exist(server);
      pool._ensure();
      done();
    });

    it('lets busy sockets continue');

    it('eventually closes busy sockets if they take too long');
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
        pool._sockets['127.0.0.1:'+port]['i' + i] = {};
      }
      result = intercept(Pool.prototype, Pool.prototype._recommend);
      pool._ensure();
      result().should.equal(false);
      pool._recommend(); // reset
    });
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
      ], {
        min: 1,
        max: 2
      });
    })

    it('adds to _queue', function(done) {
      pool.queue(function(socket) { 
        setTimeout(function() {
          socket.release();
        }, 100);
      });
      pool.queue(function(socket) { 
        setTimeout(function() {
          socket.release();
          done();
        }, 100);
      });
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
        pool._sockets[server.host + ':' + server.port]['i'+i] = {};
      }
    });

    it('maintains proportions', function() {
      var server = pool._recommend();
      server.port.should.be.equal(port[0]);
      for (var i = 0; i < pool.max; i++) {
        server = pool._recommend();
        pool._sockets[server.host + ':' + server.port]['i' + i] = {};
      }
      Object.keys(pool._sockets['127.0.0.1:'+port[0]]).length.should.equal(11);
      Object.keys(pool._sockets['127.0.0.1:'+port[1]]).length.should.equal(6);
      Object.keys(pool._sockets['127.0.0.1:'+port[2]]).length.should.equal(1);
      Object.keys(pool._sockets['127.0.0.1:'+port[3]]).length.should.equal(2);
    });

    it('maximum is already met, it still recommends', function() {
      var server = pool._recommend();
      server.port.should.be.equal(port[0]);

      // fake add sockets to reach max
      for (var i = 0; i < pool.max + 20; i++) {
        pool._sockets[server.host + ':' + server.port]['i' + i] = {};
      }
      server = pool._recommend();
      server.port.should.be.equal(port[1]);

      // fake add sockets to reach max
      for (var i = 0; i < pool.max + 20; i++) {
        pool._sockets[server.host + ':' + server.port]['i' + i] = {};
        pool._sockets[server.host + ':' + port[2]]['i' + i] = {};
      }
      // server port[3] is the lowest, so the pool will keep recommeding port[3]
      for (var i = 0; i < 4; i++) {
        server = pool._recommend();
        server.port.should.be.equal(port[3]);
        pool._sockets[server.host + ':' + server.port]['qi' + i] = {};
      }

      for (var i = 0; i < 100; i++) {
        server = pool._recommend();
        pool._sockets[server.host + ':' + server.port]['zi' + i] = {};
      }
    })

    it('servers not on the avoid list', function() {
      pool._avoid['127.0.0.1:'+port[0]] = [Date.now(), 2];
      for (var i = 0; i < 100; i++) {
        // at 90 pretend the server is ok
        if (i === 90) delete(pool._avoid['127.0.0.1:'+port[0]]);
        var server = pool._recommend();
        if (i >= 90) {
          // from here on out this server is recommended
          // because it would be very low (0%) in the pool
          server.port.should.equal(port[0]);
        } else {
          server.port.should.not.equal(port[0]);
        }
        pool._sockets[server.host + ':' + server.port]['i' + i] = {};
      }
      pool.length.should.equal(100);
    })
  });

  describe('recovery', function() {
    this.timeout(4000);

    before(function() {

    });

    /*
     *  if connecting to host causes errors, they will be timed out
     *  doubling the timeout each try up to 128 minutes
     *  2,4,8,16,32,64,128
     */
    it('delays creating sockets for a certain host if errors', function(done) {
      // connection refused
      var pool = new Pool([{
        host: '127.0.0.1', port: 50001
      }])
      setTimeout(function() {
        Array.isArray(pool._avoid['127.0.0.1:50001']).should.equal(true);
        // there's no possible servers to give
        var server = pool._recommend();
        should.not.exist(server);
        pool._ensure(); // just to make sure it doesn't crash pool

        // pretend the timeout time has expired
        var lastTime = pool._avoid['127.0.0.1:50001'][0];
        pool._avoid['127.0.0.1:50001'][0] = lastTime - (pool._avoid['127.0.0.1:50001'][1] * 60 * 1000);
        server = pool._recommend();
        // in which case the pool will allow the server to try again
        server.port.should.equal(50001);
        pool._ensure();
        // on the next refusal the timeout doubles
        setTimeout(function() {
          pool._avoid['127.0.0.1:50001'][1].should.equal(4);
          done();
        }, 10);
      }, 10);
    });

    it.skip('removes avoid server if it finally succeeds', function() {

    })

    // should also unref, and close it and all that to prevent leak
    it('if a socket has been gone too long the pool drops it');

    it('basic health checks');
  })

});