// Copyright (c) 2015-present, salesforce.com, inc. All rights reserved
// Licensed under BSD 3-Clause - see LICENSE.txt or git.io/sfdc-license

const path = require('path')

const theo = require('../')

const getFixture = file =>
  path.resolve(__dirname, '../__fixtures__/', file)

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
          expect(r.delete('meta')).toMatchSnapshot()
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
          expect(r).toMatchSnapshot()
          done()
        }
      )
  })
})

describe('convertSync', () => {
  it('works', () => {
    const r = theo.convertSync({
      transform: {
        type: 'raw',
        file: getFixture('a.json')
      },
      format: {
        type: 'raw.json'
      }
    })
    expect(r).toMatchSnapshot()
  })
})

describe('convert', () => {
  it('works', done => {
    theo.convert({
      transform: {
        type: 'raw',
        file: getFixture('a.json')
      },
      format: {
        type: 'raw.json'
      }
    })
    .then(r => {
      expect(r).toMatchSnapshot()
      done()
    })
  })
})
