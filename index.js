// add 'available' event to pool with option to secure the available socket

// add a way to expire sockets from the pool when the pool hasn't heard from the socket in a long time

var Socket = require('net').Socket;

// attach special events to handle reconnects and errors
function SSocket() {

}

/*
 *  Releases the socket back into the pool
 */
SSocket.prototype.release = function() {

}

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

  this._ensure();
}

/*
 *  Returns available socket from pool
 *  Otherwise undefined is none are available  
 */
Pool.prototype.get = function() {
  return this.available.pop();
};

/*
 *  Manually add a given socket into the pool
 *  Regardless of maximum
 *
 *  Returns true if successful
 */
 Pool.prototype.add = function(socket) {
  // check its a socket
  // check if it's active
  // check if it's part of the known servers
  // attach release() and events to the socket
  return false;
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
  // if still available emit the available event
  // if still available, put it back into available pool
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
 *  Does all socket creation here
 */
Pool.prototype._ensure = function() {
  var socket_len = Object.keys(this.sockets)
    , available_len = this.available.length;

  if (this.minimum < available_len && socket_len < this.maximum) {
    var server = this._recommend();
    var sock = new Socket();
    // TODO do we do this here? what about errors?
    sock.once('connect', function() {
      // add to pool
    })
    sock.connect(server.port, server.host);
  }
};

module.exports = Pool;