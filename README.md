[![Build Status](https://travis-ci.org/lovebear/socket-pool.png)](https://travis-ci.org/lovebear/socket-pool)

# socket-pool

Socket pooling in node.js

The problem with socket pooling is there are many use cases. Which is why you mainly see socket pooling libraries for specific protocols (http, mongo, mysql, etc.).

This library neither tries to be too high level (easy but assume too much), or too low level (flexibility but managing your socket pool becomes hard).

This is for the mid-level.

## Usage

```js
var Pool = require('socket-pool');

var pool = new Pool([
  { host: '127.0.0.1', port: 80, weight: 5 },
  { host: '127.0.0.2', port: 80, weight: 10 }
], {
  min: 5,
  max: 20
});

var do_stuff_with_socket = function(socket) {
  socket.on('data', function(data) {
    // do stuff with data
    socket.release();
  });

  socket.write('some data');
}

var socket = pool.aquire();

// aquire is 'sync'
if (socket) {
  do_stuff_with_socket(socket);

} else {
  // if there's no available socket... 

  // we can queue and let the pool
  // call it whenever a socket is available
  pool.queue(do_stuff_with_socket);


  // Or we can create our own socket for now...
  socket = new Socket();
  socket.connect(...)
  .... do some stuff with the socket ...

  // when we're done we can give it to the pool too
  pool.add(socket);
}
```




