// Copyright (c) 2015-present, salesforce.com, inc. All rights reserved
// Licensed under BSD 3-Clause - see LICENSE.txt or git.io/sfdc-license

const Immutable = require('immutable')
const path = require('path')

// eslint-disable-next-line
const logResult = r =>
  console.log(JSON.stringify(r.toJS(), null, 2))

const { transform } = require('../definition')
const effects = require('../effects')

const getFixture = (file = 'a.json') =>
  effects
    .load(path.resolve(__dirname, '../__fixtures__/', file))
    .chain(effects.resolve)
    .get()

describe('definition', () => {
  it('merges global', done => {
    transform(
      getFixture(),
      Immutable.Map({ includeMeta: true })
    ).fold(
      e => { throw new Error(e) },
      r => {
        expect(r.getIn(['props', 'TOKEN_A', 'meta', 'fixture'])).toEqual('a')
        done()
      }
    )
  })
  it('merges globals (preferring local)', done => {
    transform(
      getFixture(),
      Immutable.Map({ includeMeta: true })
    ).fold(
      e => { throw new Error(e) },
      r => {
        expect(r.getIn(['props', 'TOKEN_A_A', 'meta', 'fixture'])).toEqual('override')
        done()
      }
    )
  })
  it('validates def', done => {
    const fixture = getFixture()
      .set('props', Immutable.List())
    transform(fixture).fold(
      e => {
        expect(e).toMatch(/"props" key must be an object/)
        done()
      },
      r => {}
    )
  })
  it('validates props', done => {
    const fixture = getFixture()
      .deleteIn(['global', 'type'])
    transform(fixture).fold(
      e => {
        expect(e).toMatch(/Property .+? contained no "type" key/)
        done()
      },
      r => {}
    )
  })
  it('merges imports', done => {
    transform(
      getFixture(),
      Immutable.Map({ includeMeta: true })
    ).fold(
      e => { throw new Error(e) },
      r => {
        expect(r.getIn(['props', 'TOKEN_B', 'value'])).toEqual('#FFFFFF')
        expect(r.getIn(['props', 'TOKEN_B', 'meta', 'fixture'])).toEqual('b')
        expect(r.getIn(['props', 'TOKEN_A_B', 'value'])).toEqual('#FFFFFF')
        done()
      }
    )
  })
  it.skip('overrides an imported alias if a local alias is defined with the same name', done => {
    transform(
      getFixture()
    ).fold(
      e => { throw new Error(e) },
      r => {
        expect(r.getIn(['aliases', 'burgundy', 'value'])).toEqual('#FF0000')
        done()
      }
    )
  })
  it.skip('overrides an imported prop if a local prop is defined with the same name', done => {
    transform(
      getFixture()
    ).fold(
      e => { throw new Error(e) },
      r => {
        expect(r.getIn(['props', 'TOKEN_C', 'value'])).toEqual('#000000')
        done()
      }
    )
  })
  it('returns an error for circular alias references', done => {
    const fixture = getFixture()
      .setIn(['aliases', 'scarlet', 'value'], '{!crimson}')
    transform(fixture).fold(
      e => {
        expect(e.message).toMatch(/call stack/)
        done()
      },
      r => {}
    )
  })
  it('resolves aliases', done => {
    transform(getFixture()).fold(
      e => { throw new Error(e) },
      r => {
        expect(r.getIn(['props', 'TOKEN_A', 'value'])).toEqual('#FF0000')
        done()
      }
    )
  })
  it('resolves nested aliases', done => {
    transform(getFixture()).fold(
      e => { throw new Error(e) },
      r => {
        expect(r.getIn(['props', 'TOKEN_A_A', 'value'])).toEqual('#FF0000 #FF0000')
        done()
      }
    )
  })
  it('returns an error for missing aliases values', done => {
    const fixture = getFixture()
      .setIn(['props', 'TOKEN_A', 'value'], '{!some}')
    transform(fixture).fold(
      e => {
        expect(e.message).toEqual('Alias "some" not found')
        done()
      },
      r => {}
    )
  })
  it('transforms values', done => {
    const options = Immutable.fromJS({
      transforms: [{
        predicate: prop => prop.get('name') === 'TOKEN_A_A',
        transform: prop => 'TEST'
      }]
    })
    transform(getFixture(), options).fold(
      e => { throw new Error(e) },
      r => {
        expect(r.getIn(['props', 'TOKEN_A_A', 'value'])).toEqual('TEST')
        done()
      }
    )
  })
  it('runs options.preprocess', done => {
    const options = Immutable.fromJS({
      preprocess: def => def.setIn(['global', 'hello'], 'world')
    })
    transform(getFixture(), options).fold(
      e => { throw new Error(e) },
      r => {
        expect(r.getIn(['props', 'TOKEN_A_A', 'hello'])).toEqual('world')
        done()
      }
    )
  })
  it('checks options.resolveAliases', done => {
    const options = Immutable.fromJS({
      resolveAliases: false
    })
    transform(getFixture(), options).fold(
      e => { throw new Error(e) },
      r => {
        expect(r.getIn(['props', 'TOKEN_A_A', 'value'])).toEqual('{!scarlet} {!crimson}')
        done()
      }
    )
  })
  it('reformats simple aliases', done => {
    const fixture = getFixture()
      .setIn(['aliases', 'TOKEN_SIMPLE'], 'red')
      .setIn(['props', 'TOKEN_SIMPLE', 'value'], '{!TOKEN_SIMPLE}')
    transform(fixture).fold(
      e => { throw new Error(e) },
      r => {
        expect(r.getIn(['props', 'TOKEN_SIMPLE', 'value'])).toEqual('red')
        done()
      }
    )
  })
  it('reformats simple aliases (non string)', done => {
    const fixture = getFixture()
      .setIn(['aliases', 'TOKEN_SIMPLE'], 2)
      .setIn(['props', 'TOKEN_SIMPLE', 'value'], '{!TOKEN_SIMPLE}')
    transform(fixture).fold(
      e => { throw new Error(e) },
      r => {
        expect(r.getIn(['props', 'TOKEN_SIMPLE', 'value'])).toEqual('2')
        done()
      }
    )
  })
  it('includes rawValue', done => {
    const options = Immutable.fromJS({
      includeRawValue: true
    })
    transform(getFixture(), options).fold(
      e => { throw new Error(e) },
      r => {
        expect(r.getIn(['props', 'TOKEN_A_A', 'rawValue'])).toEqual('{!scarlet} {!crimson}')
        done()
      }
    )
  })
  it('excludes meta', done => {
    transform(getFixture()).fold(
      e => { throw new Error(e) },
      r => {
        expect(r.hasIn(['props', 'TOKEN_A_A', 'meta'])).toBe(false)
        done()
      }
    )
  })
})
