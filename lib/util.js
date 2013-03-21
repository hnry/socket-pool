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
 *  Calculates length of object
 *  passed the first level
 */
exports.objlength = function(obj) {
  var props = Object.keys(obj);
  var len = 0;
  for (var i = 0, l = props.length; i < l; i++) {
    len += Object.keys(obj[props[i]]).length;
  }
  return len;
}