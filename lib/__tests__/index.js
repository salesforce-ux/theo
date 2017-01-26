const path = require('path')

const theo = require('../')

const getFixture = file =>
  path.resolve(__dirname, '../__fixtures__/', file)

describe('theo', () => {
  describe('transform', () => {
    it('works', done => {
      theo
        .transform({
          type: 'raw',
          file: getFixture('a.json')
        })
        .fold(
          e => { throw new Error(e) },
          r => {
            expect(r.getIn(['props', 'TOKEN_A', 'value'])).toEqual('#FF0000')
            done()
          }
        )
    })
  })
  describe('format', () => {
    it('works', done => {
      theo
        .transform({
          type: 'raw',
          file: getFixture('a.json')
        })
        .chain(data =>
          theo.format({
            type: 'raw.json',
            data
          })
        )
        .fold(
          e => { throw new Error(e) },
          r => {
            expect(JSON.parse(r).props.TOKEN_A.value).toEqual('#FF0000')
            done()
          }
        )
    })
  })
})
