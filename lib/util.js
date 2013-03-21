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