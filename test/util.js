var util = require('../lib/util');
var assert = require('assert');
var should = require('should');
var Socket = require('net').Socket;

describe('util', function() {

  it('toPSocket', function() {
    var socket = new Socket();
    var psocket = util.toPSocket(socket);
    psocket._socket.should.equal(socket);
    should.exist(psocket.release);
  })

  it('attachEvents', function() {
    var socket = new Socket();
    
    if (socket._events === null) socket._events = {}; // 0.8.x compat

    var originalLen = Object.keys(socket._events).length;
    util.attachEvents(socket);
    (Object.keys(socket._events).length > originalLen).should.equal(true);
    should.exist(socket._events.data);
    should.exist(socket._events.close);
    should.exist(socket._events.timeout);
    should.exist(socket._events.error);
  });

  it('generateId', function() {
    var dest = {};
    var i = 0;
    while (i < 100) {
      var id = util.generateId(dest);
      if (dest[id]) throw new Error('generateId didn\'t check unique')
      dest[id] = true;
      i++;
    }
  });

  it('removeEvents', function() {
    var socket = new Socket();
    socket.on('close', function() {});    
    socket.on('end', function() {});
    socket.on('timeout', function() {});
    socket._events.toString().should.not.eql({});
    util.removeEvents(socket);
    socket._events.should.eql({});
  });

  it('calcAvoidServers', function() {
    var ret = util.calcAvoidServers({
      '1': [Date.now(), 2],
      '2': [Date.now() - 2 * 60 * 1000, 2],
      '3': [Date.now(), 2]
    })
    ret.should.eql(['1', '3']);
  });

  it('calcServerTimeout', function() {
    var ret = util.calcServerTimeout([]);
    Array.isArray(ret).should.equal(true);
    ret[1].should.equal(2);

    var timeHasntPassed = [Date.now(), 2];
    ret = util.calcServerTimeout(timeHasntPassed);
    ret.should.eql(timeHasntPassed);
  });

  it('arrayDiff', function() {
    var arr = [1,2,3,4,5];
    var arr2 = [2, 4];

    var result = util.arrayDiff(arr, arr2);
    result.should.eql([1,3,5]);
  });

  it('delayCall', function(done) {
    var seq = [];
    var socket = new Socket();
    socket.on('error', function(err) {
      seq.unshift(2);
    });
    util.delayCall(function() {
      seq.unshift(3);
      seq.should.eql([3,2,1]);
      done();
    });
    seq.unshift(1);
    socket.connect(100);
  });

});
