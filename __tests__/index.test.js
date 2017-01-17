/* eslint-env node, jest */
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

const path = require('path')
const gulp = require('gulp')
const through = require('through2')
const _ = require('lodash')
const xml2js = require('xml2js')

const $stream = require('./stream-util')
const $props = require('../lib')

describe('$props', () => {
  describe('#getValueTransform()', () => {
    it('throws an error if the valueTransform is not registered', () => {
      assert.throws(() => {
        $props.getValueTransform('foo')
      })
    })
    it('returns a copy of the valueTransform', () => {
      const t = $props.getValueTransform('color/rgb')
      assert.strictEqual(typeof t.matcher, 'function')
      assert.strictEqual(typeof t.transformer, 'function')
    })
  })

  describe('#valueTransformIsRegistered()', () => {
    it('returns true if the value transform is registered', () => {
      assert($props.valueTransformIsRegistered('color/rgb'))
    })
    it('returns false if the value transform isnt registered', () => {
      assert.strictEqual($props.valueTransformIsRegistered('color/rgb/foo'), false)
    })
  })

  describe('#registerValueTransform()', () => {
    const matcher = () => {}
    const transformer = () => {}
    it('throws an error if the name is not passed or is not a string', () => {
      assert.throws(() => {
        $props.registerValueTransform()
      })
      assert.throws(() => {
        $props.registerValueTransform(true)
      })
    })
    it('throws an error if the matcher is not passed or not a function', () => {
      assert.throws(() => {
        $props.registerValueTransform('foo')
      })
      assert.throws(() => {
        $props.registerValueTransform('foo', true)
      })
    })
    it('throws an error if the transformer is not passed or not a function', () => {
      assert.throws(() => {
        $props.registerValueTransform('foo', () => {})
      })
      assert.throws(() => {
        $props.registerValueTransform('foo', () => {}, true)
      })
    })
    it('registers the valueTransform', () => {
      $props.registerValueTransform('foo', matcher, transformer)
      const r = $props.getValueTransform('foo')
      assert.strictEqual(r.matcher, matcher)
      assert.strictEqual(r.transformer, transformer)
    })
    it('registers the valueTransform and overwrites any pre-existing valueTransforms', () => {
      const m = () => true
      const t = value => value
      $props.registerValueTransform('foo', m, t)
      const r = $props.getValueTransform('foo')
      assert.notStrictEqual(r.matcher, matcher)
      assert.notStrictEqual(r.transformer, transformer)
    })
  })

  describe('#getTransform()', () => {
    it('throws an error if the transform is not registered', () => {
      assert.throws(() => {
        $props.getTransform('foo')
      })
    })
    it('returns a copy of the transform', () => {
      const t = $props.getTransform('web')
      assert(_.includes(t, 'color/rgb'))
    })
  })

  describe('#transformIsRegistered()', () => {
    it('returns true if the value transform is registered', () => {
      assert($props.transformIsRegistered('web'))
    })
    it('returns false if the value transform isnt registered', () => {
      assert.strictEqual($props.transformIsRegistered('foo'), false)
    })
  })

  describe('#registerTransform()', () => {
    it('throws an error if the name is not passed or is not a string', () => {
      assert.throws(() => {
        $props.registerTransform()
      })
      assert.throws(() => {
        $props.registerTransform(true)
      })
    })
    it('throws an error if the list of valueMatchers is not passed or not an array', () => {
      assert.throws(() => {
        $props.registerTransform('foo')
      })
      assert.throws(() => {
        $props.registerTransform('foo', true)
      })
    })
    it('throws an error if any of the value transforms are not registered', () => {
      assert.throws(() => {
        $props.registerTransform('foo', ['hello'])
      })
    })
    it('registers the transform', () => {
      $props.registerTransform('foo', ['foo'])
      const r = $props.getTransform('foo')
      assert.strictEqual(r[0], 'foo')
    })
    it('registers the transform and overwrites any pre-existing transforms', () => {
      $props.registerTransform('foo', ['color/rgb'])
      const r = $props.getTransform('foo')
      assert.strictEqual(r[0], 'color/rgb')
    })
  })

  describe('#getFormat)', () => {
    it('throws an error if the format is not registered', () => {
      assert.throws(() => {
        $props.getFormat('foo')
      })
    })
    it('returns a copy of the format', () => {
      const f = $props.getFormat('scss')
      assert.strictEqual(typeof f, 'function')
    })
  })

  describe('#formatIsRegistered()', () => {
    it('returns true if the value transform is registered', () => {
      assert($props.formatIsRegistered('scss'))
    })
    it('returns false if the value transform isnt registered', () => {
      assert.strictEqual($props.formatIsRegistered('foo'), false)
    })
  })

  describe('#registerFormat()', () => {
    const formatter = () => {}
    it('throws an error if the name is not passed or is not a string', () => {
      assert.throws(() => {
        $props.registerFormat()
      })
      assert.throws(() => {
        $props.registerFormat(true)
      })
    })
    it('throws an error if the formatter is not passed or not an function', () => {
      assert.throws(() => {
        $props.registerFormat('foo')
      })
      assert.throws(() => {
        $props.registerFormat('foo', true)
      })
    })
    it('registers the format', () => {
      $props.registerFormat('foo', formatter)
      const f = $props.getFormat('foo')
      assert.strictEqual(f, formatter)
    })
  })
})

describe('$props.plugins', () => {
  describe('#file', () => {
    it('pushes a new file into the stream', (done) => {
      $props.plugins
        .file(path.resolve(__dirname, 'mock', 'sample.json'))
        .pipe($props.plugins.transform('web'))
        .pipe($props.plugins.getResult((result) => {
          assert(_.has(JSON.parse(result), 'props'))
          done()
        }))
    })
  })
  describe('#transform', () => {
    it('transforms Design Tokens as JSON', (done) => {
      gulp.src(path.resolve(__dirname, 'mock', 'sample.json'))
        .pipe($props.plugins.transform('web'))
        .pipe($props.plugins.getResult((result) => {
          assert(_.has(JSON.parse(result), 'props'))
          done()
        }))
    })
    it('transforms Design Tokens as YML', (done) => {
      gulp.src(path.resolve(__dirname, 'mock', 'sample.yml'))
        .pipe($props.plugins.transform('web'))
        .pipe($props.plugins.getResult((result) => {
          assert(_.has(JSON.parse(result), 'props'))
          done()
        }))
    })
    it('transforms Design Tokens as YAML', (done) => {
      gulp.src(path.resolve(__dirname, 'mock', 'sample.yaml'))
        .pipe($props.plugins.transform('web'))
        .pipe($props.plugins.getResult((result) => {
          assert(_.has(JSON.parse(result), 'props'))
          done()
        }))
    })
    it('transforms accepts a jsonPreProcess function', (done) => {
      gulp.src(path.resolve(__dirname, 'mock', 'sample.json'))
        .pipe($props.plugins.transform('web', {
          jsonPreProcess: (json) => {
            json.props.spacing_xx_small.label = 'xx_small'
            return json
          }
        }))
        .pipe($props.plugins.getResult((result) => {
          assert.strictEqual(JSON.parse(result).props.spacing_xx_small.label, 'xx_small')
          done()
        }))
    })
  })

  describe('#format', () => {
    it('throws an error for invalid options', () => {
      assert.throws(() => {
        $props.plugins.format('web', false)
      })
    })
    it('throws an error if options.propsFilter is not a function', () => {
      assert.throws(
        () => {
          $props.plugins.format('web', { propsFilter: false })
        },
        (error) => {
          if ((error instanceof Error) && /function/.test(error)) {
            return true
          }
        }
      )
    })
    it('throws an error if options.propsMap is not a function', () => {
      assert.throws(
        () => {
          $props.plugins.format('web', { propsMap: false })
        },
        (error) => {
          if ((error instanceof Error) && /function/.test(error)) {
            return true
          }
        }
      )
    })
    it('formats props', (done) => {
      let error
      const samplePath = path.resolve(__dirname, 'mock', 'sample.json')
      let postResult
      gulp.src(samplePath)
        .on('error', (err) => {
          error = err
        })
        .on('finish', () => {
          assert.strictEqual(error instanceof Error, false)
          assert.doesNotThrow(() => {
            JSON.parse(postResult)
          })
          done()
        })
        .pipe($props.plugins.transform('web'))
        .pipe($props.plugins.format('raw.json'))
        .pipe($props.plugins.getResult((result) => {
          postResult = result
        }))
    })
    it('filters props before formatting', (done) => {
      const samplePath = path.resolve(__dirname, 'mock', 'sample.json')
      let postResult
      gulp.src(samplePath)
        .on('finish', () => {
          assert.strictEqual(postResult.propKeys.length, 1)
          assert.strictEqual(_.keys(postResult.props).length, 1)
          done()
        })
        .pipe($props.plugins.transform('web'))
        .pipe($props.plugins.format('raw.json', {
          propsFilter: (prop) => prop.name === 'account'
        }))
        .pipe($props.plugins.getResult((result) => {
          postResult = JSON.parse(result)
        }))
    })
    it('maps props before formatting', (done) => {
      const samplePath = path.resolve(__dirname, 'mock', 'sample.json')
      let postResult
      gulp.src(samplePath)
        .on('finish', () => {
          _.forEach(postResult.props, (prop) => {
            assert(/^PREFIX_/.test(prop.name))
          })
          done()
        })
        .pipe($props.plugins.transform('web'))
        .pipe($props.plugins.format('raw.json', {
          propsMap: (prop) => {
            prop.name = 'PREFIX_' + prop.name
            return prop
          }
        }))
        .pipe($props.plugins.getResult((result) => {
          postResult = JSON.parse(result)
        }))
    })
    it('renames the file correctly', (done) => {
      let resultFile
      const samplePath = path.resolve(__dirname, 'mock', 'sample.json')
      gulp.src(samplePath)
        .on('finish', () => {
          assert(resultFile.relative, 'sample.scss')
          done()
        })
        .pipe($props.plugins.transform('web'))
        .pipe($props.plugins.format('scss'))
        .pipe(through.obj((file, enc, next) => {
          resultFile = file
          next(null, file)
        }))
    })
  })

  describe('#getResult', () => {
    it('gets the result of a transform', (done) => {
      let error
      const spy = sinon.spy()
      gulp.src(path.resolve(__dirname, 'mock', 'sample.json'))
        .on('error', (err) => {
          error = err
        })
        .on('finish', () => {
          assert.strictEqual(typeof error, 'undefined')
          assert(spy.calledOnce)
          assert.doesNotThrow(() => {
            JSON.parse(spy.getCall(0).args[0])
          })
          done()
        })
        .pipe($props.plugins.transform('web'))
        .pipe($props.plugins.getResult(spy))
    })
    it('gets the result of a format', (done) => {
      let error
      const spy = sinon.spy()
      gulp.src(path.resolve(__dirname, 'mock', 'sample.json'))
        .on('error', (err) => {
          error = err
        })
        .on('finish', () => {
          assert.strictEqual(typeof error, 'undefined')
          assert(spy.calledOnce)
          assert.doesNotThrow(() => {
            JSON.parse(spy.getCall(0).args[0])
          })
          done()
        })
        .pipe($props.plugins.transform('web'))
        .pipe($props.plugins.format('raw.json'))
        .pipe($props.plugins.getResult(spy))
    })
    it('passes the file through the stream', (done) => {
      let error
      const spy = sinon.spy()
      const spy2 = sinon.spy()
      gulp.src(path.resolve(__dirname, 'mock', 'sample.json'))
        .on('error', (err) => {
          error = err
        })
        .on('finish', () => {
          assert.strictEqual(typeof error, 'undefined')
          assert(spy.calledOnce)
          assert(spy2.calledOnce)
          done()
        })
        .pipe($props.plugins.transform('web'))
        .pipe($props.plugins.format('raw.json'))
        .pipe($props.plugins.getResult(spy))
        .pipe($props.plugins.getResult(spy2))
    })
  })
})

describe('$props:valueTransforms', () => {
  describe('color/rgb', () => {
    const t = $props.getValueTransform('color/rgb').transformer
    it('converts hex to rgb', () => {
      const p = { value: '#FF0000' }
      assert.strictEqual(t(p), 'rgb(255, 0, 0)')
    })
    it('converts rgba to rgba', () => {
      const p = { value: 'rgba(255, 0, 0, 0.8)' }
      assert.strictEqual(t(p), 'rgba(255, 0, 0, 0.8)')
    })
    it('converts hsla to rgba', () => {
      const p = { value: 'hsla(0, 100%, 50%, 0.8)' }
      assert.strictEqual(t(p), 'rgba(255, 0, 0, 0.8)')
    })
  })

  describe('color/hex', () => {
    const t = $props.getValueTransform('color/hex').transformer
    it('converts rgb to hex', () => {
      const p = { value: 'rgb(255, 0, 0)' }
      assert.strictEqual(t(p), '#ff0000')
    })
    it('converts rgba to hex', () => {
      const p = { value: 'rgb(255, 0, 0, 0.8)' }
      assert.strictEqual(t(p), '#ff0000')
    })
    it('converts hsla to hex', () => {
      const p = { value: 'hsla(0, 100%, 50%, 0.8)' }
      assert.strictEqual(t(p), '#ff0000')
    })
  })

  describe('color/hex8rgba', () => {
    const t = $props.getValueTransform('color/hex8rgba').transformer
    it('converts hex to hex8 (RRGGBBAA)', () => {
      const p = { value: '#FF0000' }
      assert.strictEqual(t(p), '#ff0000ff')
    })
    it('converts rgba to hex8 (RRGGBBAA)', () => {
      const p = { value: 'rgba(255, 0, 0, 0.8)' }
      assert.strictEqual(t(p), '#ff0000cc')
    })
    it('converts hsla to hex8 (RRGGBBAA)', () => {
      const p = { value: 'hsla(0, 100%, 50%, 0.8)' }
      assert.strictEqual(t(p), '#ff0000cc')
    })
  })

  describe('color/hex8argb', () => {
    const t = $props.getValueTransform('color/hex8argb').transformer
    it('converts hex to hex8 (AARRGGBB)', () => {
      const p = { value: '#FF0000' }
      assert.strictEqual(t(p), '#ffff0000')
    })
    it('converts rgba to hex8 (AARRGGBB)', () => {
      const p = { value: 'rgba(255, 0, 0, 0.8)' }
      assert.strictEqual(t(p), '#ccff0000')
    })
    it('converts hsla to hex8 (AARRGGBB)', () => {
      const p = { value: 'hsla(0, 100%, 50%, 0.8)' }
      assert.strictEqual(t(p), '#ccff0000')
    })
  })

  describe('percentage/float', () => {
    const t = $props.getValueTransform('percentage/float').transformer
    it('converts a percentage to a float', () => {
      const p = { value: '50%' }
      assert.strictEqual(t(p), '0.5')
    })
    it('converts multiple percentages to a floats', () => {
      const p = { value: 'background-size: 50% 50%' }
      assert.strictEqual(t(p), 'background-size: 0.5 0.5')
    })
  })

  describe('relative/pixel', () => {
    const t = $props.getValueTransform('relative/pixel').transformer
    it('converts em to px', () => {
      const p = { value: '1em' }
      const m = { baseFontPercentage: 100, baseFontPixel: 16 }
      assert.strictEqual(t(p, m), '16px')
    })
    it('converts rem to px', () => {
      const p = { value: '1rem' }
      const m = { baseFontPercentage: 100, baseFontPixel: 16 }
      assert.strictEqual(t(p, m), '16px')
    })
    it('takes the baseFontPercentage into account', () => {
      const p = { value: '1rem' }
      const m = { baseFontPercentage: 50, baseFontPixel: 16 }
      assert.strictEqual(t(p, m), '8px')
    })
    it('takes the baseFontPixel into account', () => {
      const p = { value: '1rem' }
      const m = { baseFontPercentage: 100, baseFontPixel: 5 }
      assert.strictEqual(t(p, m), '5px')
    })
  })

  describe('relative/pixelValue', () => {
    const t = $props.getValueTransform('relative/pixelValue').transformer
    it('converts em to px', () => {
      const p = { value: '1em' }
      const m = { baseFontPercentage: 100, baseFontPixel: 16 }
      assert.strictEqual(t(p, m), '16')
    })
    it('converts rem to px', () => {
      const p = { value: '1rem' }
      const m = { baseFontPercentage: 100, baseFontPixel: 16 }
      assert.strictEqual(t(p, m), '16')
    })
    it('takes the baseFontPercentage into account', () => {
      const p = { value: '1rem' }
      const m = { baseFontPercentage: 50, baseFontPixel: 16 }
      assert.strictEqual(t(p, m), '8')
    })
    it('takes the baseFontPixel into account', () => {
      const p = { value: '1rem' }
      const m = { baseFontPercentage: 100, baseFontPixel: 5 }
      assert.strictEqual(t(p, m), '5')
    })
  })
})

describe('$props:formats', () => {
  const paths = {
    sample: path.resolve(__dirname, 'mock', 'sample.json'),
    sink: path.resolve(__dirname, 'mock', 'sink.json'),
    list: path.resolve(__dirname, 'mock', 'list.json')
  }

  let result

  const $format = (transform, format, src, done) =>
    (_done) =>
      gulp.src(src)
        .pipe($props.plugins.transform(transform))
        .pipe($props.plugins.format(format))
        .pipe($stream.first((file) => {
          result = file.contents.toString()
          if (done) {
            return done(_done)
          }
          return _done()
        }))

  const $toJSON = (done) => {
    result = JSON.parse(result)
    done()
  }

  const $toXML = (done) => {
    xml2js.parseString(result, (err, r) => {
      if (err) {
        console.log(err)
      }
      result = r
      done()
    })
  }

  describe('json', () => {
    beforeAll($format('raw', 'json', paths.sample, $toJSON))
    it('converts props to json (key/value)', () =>
      assert(_.has(result, 'account')))
  })

  describe('ios.json', () => {
    beforeAll($format('raw', 'ios.json', paths.sample, $toJSON))
    it('has a "properties" array', () => {
      assert(_.has(result, 'properties'))
      assert(Array.isArray(result.properties))
    })
    it('properties have a "name" and "value"', () => {
      assert(_.has(result.properties[0], 'name'))
      assert(_.has(result.properties[0], 'value'))
    })
  })

  describe('android.xml', () => {
    beforeAll($format('raw', 'android.xml', paths.sample, $toXML))
    it('has a top level resources node', () =>
      assert(_.has(result, 'resources')))
    it('has property nodes', () =>
      assert(_.has(result.resources, 'property')))
    it('has color nodes', () =>
      assert(_.has(result.resources, 'color')))
    it('resource nodes have a "name" attribute', () =>
      _.flatten(result.resources).forEach((n) =>
        assert(_.has(n.$, 'name'))))
    it('resource nodes have a "category" attribute', () =>
      _.flatten(result.resources).forEach((n) =>
        assert(_.has(n.$, 'category'))))
  })

  describe('scss', () => {
    beforeAll($format('raw', 'scss', paths.sample))
    it('creates scss syntax', () =>
      assert.notStrictEqual(result.match(/\$spacing-none: 0;\n/g), null))
  })

  describe('scss comments', () => {
    beforeAll($format('raw', 'scss', paths.sample))
    it('preserves comments in the scss syntax', () => {
      assert.strictEqual(result.match(/\/\/ comment example\n/g).length, 1)
    })
  })

  describe('default.scss', () => {
    beforeAll($format('raw', 'default.scss', paths.sample))
    it('creates default scss syntax', () =>
      assert.notStrictEqual(result.match(/\$spacing-none: 0 !default;\n/g), null))
  })

  describe('map.scss', () => {
    it('creates a scss map syntax', (done) =>
      gulp.src(paths.sample)
        .pipe($props.plugins.transform('raw'))
        .pipe($props.plugins.format('map.scss'))
        .pipe($stream.first((file) => {
          const result = file.contents.toString()
          const hasName = new RegExp(_.escapeRegExp('$sample-map: ('))
          const hasProp = new RegExp(_.escapeRegExp('"spacing-none": (0),'))
          assert(hasName.test(result))
          assert(hasProp.test(result))
          done()
        }))
    )
    it('names the map if options.nameSuffix was passed', (done) =>
      gulp.src(paths.sample)
        .pipe($props.plugins.transform('raw'))
        .pipe($props.plugins.format('map.scss', {
          nameSuffix: '-custom'
        }))
        .pipe($stream.first((file) => {
          const result = file.contents.toString()
          const hasName = new RegExp(_.escapeRegExp('$sample-custom: ('))
          const hasProp = new RegExp(_.escapeRegExp('"spacing-none": (0),'))
          assert(hasName.test(result))
          assert(hasProp.test(result))
          done()
        }))
    )
    it('names the map if options.name was passed', (done) =>
      gulp.src(paths.sample)
        .pipe($props.plugins.transform('raw'))
        .pipe($props.plugins.format('map.scss', {name: (basename, path) =>
          _.camelCase(basename) + 'Map'
        }))
        .pipe($stream.first((file) => {
          const result = file.contents.toString()
          const hasName = new RegExp(_.escapeRegExp('$sampleMap: ('))
          const hasProp = new RegExp(_.escapeRegExp('"spacing-none": (0),'))
          assert(hasName.test(result))
          assert(hasProp.test(result))
          done()
        }))
    )
  })

  describe('map.variables.scss', () => {
    it('creates a scss map syntax with variable values', (done) =>
      gulp.src(paths.sample)
        .pipe($props.plugins.transform('raw'))
        .pipe($props.plugins.format('map.variables.scss'))
        .pipe($stream.first((file) => {
          const result = file.contents.toString()
          const hasName = new RegExp(_.escapeRegExp('$sample-map-variables: ('))
          const hasPropA = new RegExp(_.escapeRegExp('"spacing-none": ($spacing-none),'))
          const hasPropB = new RegExp(_.escapeRegExp('"font": ($font)'))
          assert(hasName.test(result))
          assert(hasPropA.test(result))
          assert(hasPropB.test(result))
          done()
        }))
    )
  })

  describe('list.scss', () => {
    it('creates a scss list syntax', (done) => {
      gulp.src(paths.list)
        .pipe($props.plugins.transform('raw'))
        .pipe($props.plugins.format('list.scss'))
        .pipe($stream.first((file) => {
          const result = file.contents.toString()
          const hasName = new RegExp(_.escapeRegExp('$list-list: ('))
          const hasProp = new RegExp(_.escapeRegExp('"a",'))
          assert(hasName.test(result))
          assert(hasProp.test(result))
          done()
        }))
    })
    it('names the list if options.name was passed', (done) => {
      gulp.src(paths.list)
        .pipe($props.plugins.transform('raw'))
        .pipe($props.plugins.format('list.scss', {name: (basename, path) =>
          'HelloList'
        }))
        .pipe($stream.first((file) => {
          const result = file.contents.toString()
          const hasName = new RegExp(_.escapeRegExp('$HelloList: ('))
          const hasProp = new RegExp(_.escapeRegExp('"a",'))
          assert(hasName.test(result))
          assert(hasProp.test(result))
          done()
        }))
    })
  })

  describe('sass', () => {
    beforeAll($format('raw', 'sass', paths.sample))
    it('creates sass syntax', () =>
      assert.notStrictEqual(result.match(/\$spacing-none: 0\n/g), null))
  })

  describe('default.sass', () => {
    beforeAll($format('raw', 'default.sass', paths.sample))
    it('creates default sass syntax', () =>
      assert.notStrictEqual(result.match(/\$spacing-none: 0 !default\n/g), null))
  })

  describe('less', () => {
    beforeAll($format('raw', 'less', paths.sample))
    it('creates less syntax', () =>
      assert.notStrictEqual(result.match(/@spacing-none: 0;\n/g), null))
  })

  describe('styl', () => {
    beforeAll($format('raw', 'styl', paths.sample))
    it('creates stylus syntax', () =>
      assert.notStrictEqual(result.match(/spacing-none = 0\n/g), null))
  })

  describe('aura.theme', () => {
    beforeAll($format('raw', 'aura.theme', paths.sample, $toXML))
    it('has a top level aura:theme node', () =>
      assert(_.has(result, 'aura:theme')))
    it('adds the "extends" attribute', () => {
      assert(_.has(result['aura:theme'].$, 'extends'))
      assert.strictEqual(result['aura:theme'].$.extends, 'one:theme')
    })
    it('has aura:const nodes', () =>
      assert(_.has(result['aura:theme'], 'aura:var')))
    it('aura:const nodes have a "name" attribute', () =>
      result['aura:theme']['aura:var'].forEach((n) =>
        assert(_.has(n.$, 'name'))))
    it('aura:const nodes have a "value" attribute', () =>
      result['aura:theme']['aura:var'].forEach((n) =>
        assert(_.has(n.$, 'value'))))
    it('has aura:importTheme nodes', () =>
      assert(_.has(result['aura:theme'], 'aura:importTheme')))
    it('aura:importTheme nodes have a "name" attribute', () =>
      result['aura:theme']['aura:importTheme'].forEach((n) =>
        assert(_.has(n.$, 'name'))))
  })

  describe('aura.tokens', () => {
    beforeAll($format('raw', 'aura.tokens', paths.sample, $toXML))
    it('has a top level aura:tokens node', () => {
      assert(_.has(result, 'aura:tokens'))
    })
    it('adds the "extends" attribute', () => {
      assert(_.has(result['aura:tokens'].$, 'extends'))
      assert.strictEqual(result['aura:tokens'].$.extends, 'one:theme')
    })
    it('has aura:token nodes', () => {
      assert(_.has(result['aura:tokens'], 'aura:token'))
    })
    it('aura:token nodes have a "name" attribute', () =>
      result['aura:tokens']['aura:token'].forEach((n) =>
        assert(_.has(n.$, 'name'))))
    it('aura:token nodes have a "value" attribute', () =>
      result['aura:tokens']['aura:token'].forEach((n) =>
        assert(_.has(n.$, 'value'))))
    it('aura:token nodes have a "property" attribute if the token has a "cssProperties" key', () => {
      const token = _.find(result['aura:tokens']['aura:token'], (n) =>
        n.$.name === 'spacingNone'
      )
      assert(_.has(token, '$.property'))
      assert.strictEqual(token.$.property, 'width,height,padding,margin')
    })
    it('has aura:import nodes', () =>
      assert(_.has(result['aura:tokens'], 'aura:import')))
    it('aura:import nodes have a "name" attribute', () =>
      result['aura:tokens']['aura:import'].forEach((n) =>
        assert(_.has(n.$, 'name'))))
  })

  describe('html', () => {
    beforeAll($format('raw', 'html', paths.sink))
    it('outputs HTML', () => {
      const re = new RegExp(_.escapeRegExp('<!DOCTYPE html>'))
      assert(re.test(result))
    })
    it('has examples', () => {
      const re = new RegExp(_.escapeRegExp('<div class="metric-box"'))
      assert(re.test(result))
    })
    it('renders a full html document', () =>
      expect(result).toMatchSnapshot()
    )
  })

  describe('common.js', () => {
    beforeAll($format('ios', 'common.js', paths.sink))
    it('outputs a CommonJS module', () => {
      const a = new RegExp('^' + _.escapeRegExp('module.exports = {'))
      assert(a.test(result))
      const b = new RegExp(_.escapeRegExp('};') + '$')
      assert(b.test(result))
    })
    it('evaluates as JavaScript', () =>
      assert.doesNotThrow(() =>
        eval('var module = {};' + result)))
  })

  describe('amd.js', () => {
    beforeAll($format('ios', 'amd.js', paths.sink))
    it('outputs a CommonJS module', () => {
      const a = new RegExp('^' + _.escapeRegExp('define(function() {'))
      assert(a.test(result))
      const b = new RegExp(_.escapeRegExp('});') + '$')
      assert(b.test(result))
    })
    it('evaluates as JavaScript', () =>
      assert.doesNotThrow(() =>
        eval('var define = function(){};' + result)))
  })
})
