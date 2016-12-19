/* eslint-env node, mocha */
/* eslint no-eval: off */
/*
Copyright (c) 2015, salesforce.com, inc. All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
Neither the name of salesforce.com, inc. nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

const assert = require('assert')
const sinon = require('sinon')

const fs = require('fs')
const path = require('path')
const gulp = require('gulp')
const gutil = require('gulp-util')
const through = require('through2')
const _ = require('lodash')

const PropSet = require('../../dist/props/prop-set')

function isError (error) {
  return (error instanceof Error) || error instanceof gutil.PluginError
}

describe('PropSet', () => {
  let def
  let file
  let t1
  let t2
  let set

  beforeEach(() => {
    const p = path.resolve(__dirname, 'mock', 'c.json')
    const f = fs.readFileSync(p)
    def = JSON.parse(f)
    file = new gutil.File({
      path: p,
      contents: new Buffer(f)
    })
    t1 = {
      matcher: (prop) => prop.category === 'test-a',
      transformer: (prop) => prop.value + '__' + prop.name
    }
    t2 = {
      matcher: (prop) => prop.category === 'test-b',
      transformer: (prop) => prop.name
    }
    set = new PropSet(file, [t1, t2])
  })

  describe('#constructor', () => {
    it('throws an error if a non-vinyl file is passed', () => {
      try {
        const propset = new PropSet(new Buffer('{}'), [])
      } catch (error) {
        assert(isError(error))
        assert(/vinyl/.test(error.message))
      }
    })
    it('saves the file, path, and transforms', () => {
      const file = new gutil.File({
        path: 'foobar.json',
        contents: new Buffer('{"props":{}}')
      })
      const valueTransforms = ['foo']
      const set = new PropSet(file, valueTransforms)
      assert.strictEqual(set.file, file)
      assert.strictEqual(set.path, 'foobar.json')
      assert.strictEqual(set.valueTransforms, valueTransforms)
    })
    it('throws an error if invalid JSON is encountered', () => {
      try {
        const file = new gutil.File({
          path: 'foobar.json',
          contents: new Buffer('{foo:')
        })
        const propset = new PropSet(file, [])
      } catch (error) {
        assert(isError(error))
        assert(/encountered an invalid/.test(error.message))
      }
    })
    it('saves the def', () => {
      assert(_.has(set, 'def'))
    })
    it('cleans up the def', () => {
      assert(!_.has(set.def, 'global'))
      assert(!_.has(set.def, 'imports'))
    })
    it('resolves imports', () => {
      ['a', 'b', 'c', 'd', 'e'].forEach((name) =>
        assert(_.has(set.def.props, name)))
    })
    it('resolves imports with duplicate props', () => {
      assert.strictEqual(set.def.props.a.value, '2em')
    })
    it('merges globals before import', () => {
      assert.strictEqual(set.def.props.a.category, 'test-b')
    })
    it('resolves aliases', () => {
      assert.strictEqual(set.def.props.b.value, 'blue')
      assert.strictEqual(set.def.props.c.value, 'green')
      assert.strictEqual(set.def.props.f.value, 'green')
    })
    it('resolves aliases calling other aliases', () => {
      assert.strictEqual(set.def.props.g.value, 'green')
      assert.strictEqual(set.def.props.h.value, 'green')
    })
    it('only resolves aliases if options.resolveAliases isn\'t false', () => {
      const def = {
        aliases: { sky: 'blue', land: 'green' },
        global: { type: 'foo', category: 'bar' },
        props: {
          a: { value: '{!sky}' },
          b: { value: 'foo' },
          c: { value: '{!land} {!sea}' }
        }
      }
      const defFile = new gutil.File({
        path: 'test.json',
        contents: new Buffer(JSON.stringify(def))
      })
      set = new PropSet(defFile, [], { resolveAliases: false })
      assert.strictEqual(set.def.props.a.value, '{!sky}')
      assert.strictEqual(set.def.props.b.value, 'foo')
      assert.strictEqual(set.def.props.c.value, '{!land} {!sea}')
    })
    it('includes a ".rawValue" if options.includeRawValue is true', () => {
      const def = {
        aliases: { sky: 'blue', land: 'green', sea: 'clear' },
        global: { type: 'foo', category: 'bar' },
        props: {
          a: { value: '{!sky}' },
          b: { value: 'foo' },
          c: { value: '{!land} {!sea}' }
        }
      }
      const defFile = new gutil.File({
        path: 'test.json',
        contents: new Buffer(JSON.stringify(def))
      })
      set = new PropSet(defFile, [], { includeRawValue: true })
      assert.strictEqual(set.def.props.a.value, 'blue')
      assert.strictEqual(set.def.props.a['.rawValue'], '{!sky}')
      assert.strictEqual(set.def.props.b.value, 'foo')
      assert.strictEqual(set.def.props.b['.rawValue'], 'foo')
      assert.strictEqual(set.def.props.c.value, 'green clear')
      assert.strictEqual(set.def.props.c['.rawValue'], '{!land} {!sea}')
    })
  })

  describe('#_validate', () => {
    it('throws an error if "props" is an array', () => {
      try {
        const def = {props: []}
        set._validate(def)
      } catch (error) {
        assert(isError(error))
        const re = new RegExp(_.escapeRegExp('"props" key must be an object'))
        assert(re.test(error.message))
      }
    })
    it('throws an error if any prop is malformed', () => {
      const keys = ['value', 'type', 'category']
      keys.forEach((key) => {
        try {
          const def = {props: {a: {}}}
          _.without(keys, key).forEach(function (k) {
            def.props.a[k] = 'test'
          })
          set._validate(def)
        } catch (error) {
          assert(isError(error))
          const re = new RegExp(_.escapeRegExp('contained no "' + key + '" key'))
          assert(re.test(error.message))
        }
      })
    })
  })

  describe('#_resolveGlobals', () => {
    it('returns undefined if no keys were found in def.global', () => {
      const def = { global: {} }
      assert.strictEqual(set._resolveGlobals(def), undefined)
    })
    it('merges def.global into each def.props', () => {
      const def = { global: {foo: 'bar'}, props: { a: { value: 'hello' } } }
      set._resolveGlobals(def)
      assert(_.has(def.props.a, 'foo'))
      assert.strictEqual(def.props.a.foo, 'bar')
    })
    it('doesn\'t overwrite existing keys', () => {
      const def = { global: {foo: 'bar'}, props: { a: { foo: 'baz' } } }
      set._resolveGlobals(def)
      assert(_.has(def.props.a, 'foo'))
      assert.strictEqual(def.props.a.foo, 'baz')
    })
    it('doesn\'t merge object values', () => {
      const def = { global: {foo: ['a', 'b', 'c']}, props: { a: { foo: ['d'] } } }
      set._resolveGlobals(def)
      assert(_.has(def.props.a, 'foo'))
      assert.deepEqual(def.props.a.foo, ['d'])
    })
    it('removes the "global" key from the def', () => {
      const def = { global: {foo: 'bar'}, props: { a: { foo: 'baz' } } }
      set._resolveGlobals(def)
      assert(!_.has(def, 'global'))
    })
  })

  describe('#_resolveAliases', () => {
    it('replaces all instances of an alias in string values', () => {
      const def = {
        aliases: { sky: 'blue', land: 'green' },
        props: {
          a: { value: '{!sky}' },
          b: { value: '{!sky} - {!sky}' },
          c: { value: '{!sky} - {!land}' }
        }
      }
      set._resolveAliases(def)
      assert.strictEqual(def.props.a.value, 'blue')
      assert(!_.has(def.props.a, 'alias'))
      assert.strictEqual(def.props.b.value, 'blue - blue')
      assert.strictEqual(def.props.c.value, 'blue - green')
    })
  })
  it('throws an error if an alias does not exist', () => {
    const def = {
      aliases: { sky: 'blue' },
      global: { type: 'foo', category: 'bar' },
      props: {
        a: { value: '{!sky} {!randomalias}' },
        b: { value: '{!randomalias}' }
      }
    }
    assert.throws(() => {
      set._resolveAliases(def)
    })
  })

  describe('#_resolveImports', () => {
    it('returns an empty array if no imports are found', () => {
      const def = { props: {} }
      const imports = set._resolveImports(def)
      assert(_.isArray(imports))
      assert.strictEqual(imports.length, 0)
    })
    it('throws an error if an import is not found', () => {
      const def = { props: {}, imports: ['./foo/bar.json'] }
      assert.throws(() => {
        set._resolveImports(def)
      })
    })
    it('returns an array of PropSets', () => {
      const imports = set._resolveImports(def)
      assert(_.isArray(imports))
      assert.strictEqual(imports.length, 2)
      assert(imports[0] instanceof PropSet)
      assert(/a\.json$/.test(imports[0].path))
      assert(imports[1] instanceof PropSet)
      assert(/b\.json$/.test(imports[1].path))
    })
  })

  function transformProps () {
    it('gives each prop a "name" key', () => {
      set._transformProps()
      _.forEach(set.def.props, (prop, key) => {
        assert(_.has(prop, 'name'))
        assert.strictEqual(prop.name, key)
      })
    })
    it('runs each prop through the matcher/transformer', () => {
      set._transformProps();
      ['b', 'c'].forEach((name) => {
        const re = new RegExp('__' + name + '$')
        assert(re.test(set.def.props[name].value))
      });
      ['a', 'd'].forEach((name) => {
        assert.strictEqual(set.def.props[name].value, name)
      })
    })
    it('deletes the ".meta" key for each prop', () => {
      set._transformProps()
      _.forEach(set.def.props, (prop) => {
        assert(!_.has(prop, '.meta'))
      })
    })
    it('deletes the ".meta" key for each prop', () => {
      set._transformProps()
      _.forEach(set.def.props, (prop) => {
        assert(!_.has(prop, '.meta'))
      })
    })
    it('includes the ".meta" key for each prop if specified in the options', () => {
      set = new PropSet(file, [t1, t2], { includeMeta: true })
      set._transformProps()
      _.forEach(set.def.props, (prop) => {
        assert(_.has(prop, '.meta'))
      })
    })
  }

  describe('#_transformProps', transformProps)

  describe('#_transformValue', () => {
    let t1
    let prop
    let meta
    beforeEach(() => {
      t1 = {
        matcher: sinon.stub().returns(true),
        transformer: sinon.stub().returns('transform')
      }
      prop = {
        name: 'a',
        value: 'hello',
        type: 'string',
        category: 'test'
      }
      meta = {
        foo: 'bar'
      }
      set.valueTransforms = [t1]
    })
    it('calls each matcher with the cloned prop and meta', () => {
      set._transformValue(prop, meta)
      assert(t1.matcher.calledOnce)
      assert.notStrictEqual(t1.matcher.getCall(0).args[0], prop)
      assert.notStrictEqual(t1.matcher.getCall(0).args[1], meta)
    })
    it('calls each transformer with the cloned prop and meta', () => {
      set._transformValue(prop, meta)
      assert(t1.transformer.calledOnce)
      assert.notStrictEqual(t1.transformer.getCall(0).args[0], prop)
      assert.notStrictEqual(t1.transformer.getCall(0).args[1], meta)
    })
    it('only calls the transformer if the matcher returns true', () => {
      t1.matcher = sinon.stub().returns(false)
      set._transformValue(prop, meta)
      assert(t1.matcher.called)
      assert(!t1.transformer.called)
    })
  })

  describe('#transform', () => {
    it('transforms the props', transformProps)
    it('returns the PropSet', () => {
      const s = set.transform()
      assert.strictEqual(s, set)
    })
  })

  describe('#toJSON', () => {
    it('returns a string', () => {
      assert.strictEqual(typeof set.toJSON(), 'string')
    })
    it('returns valid JSON', () => {
      const json = set.toJSON()
      assert.doesNotThrow(() => {
        JSON.parse(json)
      })
    })
    it('adds a "propKeys" array', () => {
      const def = JSON.parse(set.toJSON())
      assert(_.has(def, 'propKeys'))
      assert(_.isArray(def.propKeys))
      assert.strictEqual(def.propKeys.length, _.keys(def.props).length)
      assert.strictEqual(_.intersection(def.propKeys, _.keys(def.props)).length, def.propKeys.length)
    })
  })

  describe('#toBuffer', () => {
    it('returns a Buffer', () => {
      assert(set.toBuffer() instanceof Buffer)
    })
    it('returns a Buffer with the JSON', () => {
      assert.strictEqual(set.toBuffer().toString(), set.toJSON())
    })
  })
})

