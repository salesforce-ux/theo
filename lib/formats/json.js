const Immutable = require('immutable')

module.exports = def =>
  JSON.stringify(
    def.get('props').reduce((a, b, c) => a.set(c, b.get('value')), Immutable.Map()),
    null,
    2
  )
