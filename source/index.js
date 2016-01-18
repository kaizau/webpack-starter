var fs = require('fs');

fs.readdirSync(__dirname + '/pages/').forEach(function(file) {
  require('./pages/' + file);
});
