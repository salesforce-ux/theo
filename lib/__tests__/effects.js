// Copyright (c) 2015, salesforce.com, inc. - All rights reserved
// Licensed under BSD 3-Clause - https://opensource.org/licenses/BSD-3-Clause

const fs = require('fs')
const Immutable = require('immutable')
const path = require('path')

const effects = require('../effects')

const getFixture = file =>
  path.resolve(__dirname, '../__fixtures__/', file)

describe('effects', () => {
  describe('load', () => {
    it('returns the file and data', done => {
      effects
        .load(getFixture('a.json'))
        .fold(
          e => { throw new Error(e) },
          r => {
            expect(r.file).toEqual(getFixture('a.json'))
            expect(r.data).toEqual(fs.readFileSync(getFixture('a.json'), 'utf8'))
            done()
          }
        )
    })
  })
  describe('parse', () => {
    it('parses json', done => {
      effects
        .load(getFixture('a.json'))
        .chain(effects.parse)
        .fold(
          e => { throw new Error(e) },
          r => {
            expect(() => {
              JSON.stringify(r)
            }).not.toThrow()
            expect(r.imports[0]).toEqual('./b.json')
            done()
          }
        )
    })
  })
  describe('resolve', () => {
    it('resolves and parses imports', done => {
      effects
        .load(getFixture('a.json'))
        .chain(effects.resolve)
        .fold(
          e => { throw new Error(e) },
          r => {
            expect(Immutable.Map.isMap(r))
            expect(Immutable.Map.isMap(r.getIn(['imports', 0])))
            done()
          }
        )
    })
  })
})
