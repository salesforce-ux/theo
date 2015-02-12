var yaml = require('js-yaml');

module.exports = {

  isRelativeSpacing(value) {
    return value.match(/(?:r)?em$/g) !== null;
  },

  remToPx(rem, baseFontPercentage, baseFontPixel) {
    return ((parseFloat(rem.replace(/r(em)/g, '')) * baseFontPixel) * (baseFontPercentage/100)) + 'px';
  },

  parsePropsFile(file) {
    if (/\.json$/.test(file.path)) {
      return JSON.parse(file.contents.toString());
    }
    if (/\.yml$/.test(file.path)) {
      return yaml.safeLoad(file.contents.toString());
    }
  }

};