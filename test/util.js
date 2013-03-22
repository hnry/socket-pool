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

  it('objlength', function() {
    var obj = {a: {'1': true, '2': true}, b: {'3': true}, c: {}};
    util.objlength(obj).should.be.equal(3);
  });

});