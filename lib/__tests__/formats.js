const path = require('path')

const theo = require('../')

const getFixture = file =>
  path.resolve(__dirname, '../__fixtures__/', file)

const format = (transform, format, fixture = 'a.json') =>
  theo
    .transform({
      type: transform,
      file: getFixture(fixture)
    })
    .chain(data =>
      theo.format({
        type: format,
        data
      })
    )
    .merge()

describe('formats', () => {
  it('raw.json', () => {
    expect(format('raw', 'raw.json')).toMatchSnapshot()
  })
  it('scss', () => {
    expect(format('web', 'scss')).toMatchSnapshot()
  })
  it('map.scss', () => {
    expect(format('web', 'map.scss')).toMatchSnapshot()
  })
})
