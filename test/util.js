var util = require('../lib/util');

describe('util', function() {
  it('generateId', function() {
    var dest = {};
    var i = 0;
    while (i < 100) {
      var id = util.generateId(dest);
      if (dest[id]) throw new Error('generateId didn\'t check unique')
      dest[id] = true;
      i++
    }
  });
});
