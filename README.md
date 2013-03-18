[![Build Status](https://travis-ci.org/lovebear/socket-pool.png)](https://travis-ci.org/lovebear/socket-pool)

# socket-pool

Socket pooling in node.js

The problem with socket pooling is there are many use cases. Which is why you mainly see socket pooling libraries for specific protocols (http, mongo, mysql, etc.).

This library neither tries to be too high level (easy but assume too much), or too low level (flexibility but managing your socket pool becomes hard).

This is for the mid-level.

## Usage / Explanation

```js
var Pool = require('socket-pool');

var pool = new Pool({
  host: '127.0.0.1',
  port: 80,
  min: 5,
  max: 10
});

```