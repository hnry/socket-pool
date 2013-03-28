var util = require('../lib/util');
var assert = require('assert');
var should = require('should');

var netSocket = require('net').Socket;

describe('util', function() {

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
    var socket = new netSocket();
    var sockLen = socket._events.toString();
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

  it('delayCall');

});
