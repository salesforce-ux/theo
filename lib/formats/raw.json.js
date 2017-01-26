module.exports = def =>
  JSON.stringify(
    def.delete('meta').toJS(),
    null,
    2
  )
