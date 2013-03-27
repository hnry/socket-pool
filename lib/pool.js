var netSocket = require('net').Socket;
var Socket = require('./socket');
var util = require('./util');

function Pool(servers, opts) {
  if (!servers || !servers.length) return;

  this.sockets = {};
  this.servers = {};

  var self = this;

  this.sockets.length = function() {
    var props = Object.keys(self.sockets);
    var len = 0;
    for (var i = 0, l = props.length; i < l; i++) {
      len += Object.keys(self.sockets[props[i]]).length;
    }
    return len;
  }

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
Pool.prototype.acquire = function() {
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
 Pool.prototype.add = function(socket) {
  // check its a socket & active
  if (!socket instanceof netSocket || !socket._handle || socket._handle.fd <= 0 || !socket.remoteAddress || !socket.remotePort) {
    return false;
  }

  var server = socket.remoteAddress + ':' + socket.remotePort;

  // check if this socket knows about this host
  if (!this.servers[server]) return false;

  // strip previous listeners from the socket
  if (!util.removeEvents(socket)) return false;

  // convert to a Pool socket
  var pSocket = new Socket(socket, this);
  pSocket.pid = util.generateId(this.sockets[server]);
  this.sockets[server][pSocket.pid] = pSocket;

  // internally notify pool
  this._available(pSocket);

  return true;
 }

/*
 *  Adds a function to the queue
 *  Will be processed on next available socket
 */
Pool.prototype.queue = function(fn) {
  this._queue.unshift(fn);
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
    var fn = this._queue.pop();
    fn(socket);
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
 */
Pool.prototype._recommend = function() {
  var serverkeys = Object.keys(this.servers);
  var serverlen = serverkeys.length;

  // get total weight
  var total_weight = 0;
  for (var i = 0; i < serverlen; i++) {
    total_weight += this.servers[serverkeys[i]].weight;
  }

  // keeps recommending after maxmium has met
  var totalsockets = this.sockets.length();
  var max = this.max;
  if (totalsockets > max) max = totalsockets;

  // calculate proportion, ordering is based on Object.keys
  var ret;
  var proportionMet = 1.0;

  for (var i = 0; i < serverlen; i++) {
    var requirement = Math.round(max / (total_weight / this.servers[serverkeys[i]].weight));
    // requirement met?
    var sockLenForServer = Object.keys(this.sockets[serverkeys[i]]).length;
    var thisPropertion = sockLenForServer / requirement;

    // if 0 and in need we can return early
    if (sockLenForServer === 0 && sockLenForServer < requirement) {
      return this.servers[serverkeys[i]];
    } else if (thisPropertion < proportionMet) {
      proportionMet = thisPropertion;
      ret = this.servers[serverkeys[i]];
    }
  }
  return ret;
};

/*
 *  Ensures minimum sockets are available
 *  Ensures maximum sockets is respected
 */
Pool.prototype._ensure = function() {
  var socket_len = this.sockets.length()
    , available_len = this.available.length;

  var self = this;
  if (this.min > available_len && socket_len < this.max) {
    var server = this._recommend();
    var sock = new netSocket();
    sock.once('connect', function() {
      self.add(this);
      self._ensure();
    });
    // if one of these are triggered during connection
    // this host/port is blacklisted for a brief period
    sock.once('error', function(err) {
      throw new Error('_ensure error' + err);
    });
    sock.once('timeout', function() {
      throw new Error('_ensure timeout');
    });
    sock.once('close', function() {
      throw new Error('_ensure close');
    });
    sock.connect(server.port, server.host);
  }
};

Pool.prototype.drain = function() {
   //this.available = [];
   //this.add = null;

   var groups = Object.keys(this.sockets);
   for (var i = 0, l = groups.length; i < l; i++) {
      var group = this.sockets[groups[i]]
        , socketids = Object.keys(group);
      for (var ii = 0, ll = socketids.length; ii < ll; ii++) {
          group[socketids[ii]].end();
      }
   }
}

module.exports = Pool;