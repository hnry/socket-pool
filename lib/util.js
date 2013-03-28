/*
 *  Randomly generate ID, and ensures unique
 */
exports.generateId = function(dest) {
  var id = Math.random().toString(16).substr(2);
  if (dest[id]) return generateId(dest);
  return id;
}

/*
 *  Remove current events from the socket
 */
exports.removeEvents = function(socket) {
  if (socket && socket.removeAllListeners) {
    socket.removeAllListeners();
    return true;
  }
  return false;
}

/*
 *  Example:
 *  [1,2,3] - [2] = [1,3]
 */
exports.arrayDiff = function(arr, arr2) {
  return arr.filter(function(ele, idx, a) {
    return (arr2.every(function(ele2, idx2, a2) {
      return (ele2 !== ele);
    }));
  });
}

/*
 *  Backwards compat setImmediate
 */
var delayFn;
if (typeof setImmediate !== 'undefined') {
  delayFn = setImmediate;
} else {
  delayFn = function(fn, arg) {
    setTimeout(function() {
      fn(arg);
    }, 0);
  }
}
exports.delayCall = function(fn, arg) {
  delayFn(fn, arg);
}