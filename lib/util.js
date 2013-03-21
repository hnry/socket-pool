/*
 *  Randomly generate ID, and ensures unique
 */
exports.generateId = function(dest) {
  var id = Math.random().toString(16).substr(2);
  if (dest[id]) return generateId(dest);
  return id;
}