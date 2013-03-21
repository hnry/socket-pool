var netSocket = require('net').Socket;
var Socket = require('./socket');
var util = require('./util');

function Pool(servers, opts) {
  if (!servers || !servers.length) return;

  this.sockets = {};
  this.servers = {};

  for (var i = 0, l = servers.length; i < l; i++) {
    var s = servers[i];
    var tag = s.tag || s.host + ':' + s.port;
    if (this.servers[tag] || this.sockets[tag]) throw new Error('non unique tag');
    this.servers[tag] = { host: s.host, port: s.port, weight: s.weight || 1 };
    this.sockets[tag] = {};
  }

  this.min = (opts && opts.min) || 5;
  this.max = (opts && opts.max) || 10;

  // available sockets
  this.available = [];

  // internally represents the queue
  this._queue = [];

  this._ensure();
}

/*
 *  Returns available socket from pool
 *  Otherwise undefined is none are available  
 */
Pool.prototype.aquire = function() {
  return this.available.pop();
};

/*
 *  Manually add a given socket into the pool
 *  Regardless of maximum
 *
 *  Interally the pool uses this to add sockets,
 *  by the maximum is checked via _ensure
 *
 *  Returns true if successful
 */
 Pool.prototype.add = function(host, socket) {
  // check its a socket & active
  if (!socket instanceof netSocket || !socket._handle || socket._handle.fd <= 0) {
    return false;
  }

  // strip previous listeners from the socket
  if (!util.removeEvents(socket)) return false;

  // convert to a Pool socket
  var pSocket = new Socket(socket);
  pSocket.pid = util.generateId(this.sockets[host.host + ':' + host.port]);
  this.sockets[host.host + ':' + host.port][pSocket.pid] = pSocket;

  // internally notify pool
  this._available(pSocket);

  return true;
 }

/*
 *  Adds a function to the queue
 *  Will be processed on next available socket
 */
Pool.prototype.queue = function(fn) {
  
};

 /*
  * internally the pool gets notified when a socket
  * is available
  *
  * the pool then processes queue
  * if nothhing in queue, it emits the 'available'
  * event
  *
  * If the socket is still not claimed, then it releases
  * it back into the available pool
  */
Pool.prototype._available = function(socket) {
  // use socket to process queue
  if (this._queue.length) {
    return;
  }

  // if still available emit the available event
  //this.emit('available', socket);

  // if still available, put it back into available pool
  this.available.unshift(socket);
}

/*
 *  Figures out what connections are more in need
 *  for the pool
 *  
 *  maximum sockets / (total weight / weight)
 */
Pool.prototype._recommend = function() {
  var serverkeys = Object.keys(this.servers);
  var serverlen = serverkeys.length;
  // would it be faster to use for in instead of Object.keys?

  // get total weight
  var total_weight = 0;
  for (var i = 0; i < serverlen; i++) {
    total_weight += this.servers[serverkeys[i]].weight;
  }

  // calculate proportion, ordering is based on Object.keys
  var requirement;
  for (var i = 0; i < serverlen; i++) {
    requirement = Math.round(this.max / (total_weight / this.servers[serverkeys[i]].weight));
    // is the requirement met?
    var sockLenForServer = Object.keys(this.sockets[serverkeys[i]]);
    if (sockLenForServer < requirement) return this.servers[serverkeys[i]];
  }
};

/*
 *  Ensures minimum sockets are available
 *  Ensures maximum sockets is respected
 */
Pool.prototype._ensure = function() {
  var socket_len = util.objlength(this.sockets)
    , available_len = this.available.length;

  var self = this;

  if (this.min > available_len && socket_len < this.max) {
    var server = this._recommend();
    var sock = new netSocket();
    sock.once('connect', function() {
      self.add(server, this);
    });
    // if one of these are triggered during connection
    // this host/port is blacklisted for a brief period
    sock.once('error', function(err) {

    });
    sock.once('timeout', function() {

    });
    sock.once('close', function() {

    });
    sock.connect(server.port, server.host);
  }
};

module.exports = Pool;