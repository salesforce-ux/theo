let gulpu = require('gulp-util');

module.exports = function(msg) {
  return new gulpu.PluginError('theo', msg);
}