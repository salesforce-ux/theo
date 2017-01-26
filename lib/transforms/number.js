const {
  PERCENTAGE_PATTERN
} = require('../constants')

module.exports = {
  'percentage/float': {
    predicate: prop =>
      /%/.test(prop.get('value')),
    transform: prop =>
      prop
        .get('value')
        .replace(PERCENTAGE_PATTERN, (match, number) => parseFloat(number / 100))
  }
}
