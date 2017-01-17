/* eslint new-cap: off */
/*
Copyright (c) 2015, salesforce.com, inc. All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
Neither the name of salesforce.com, inc. nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

const path = require('path')
const fs = require('fs')
const _ = require('lodash')
const through = require('through2')
const gutil = require('gulp-util')
const tinycolor = require('tinycolor2')

const util = require('./util')
const constants = require('./util/constants')
const kebabCase = require('./util/kebabCase')
const TheoError = require('./util/error')

const PropSet = require('./prop-set')

const camelCase = require('lodash/camelCase')

// //////////////////////////////////////////////////////////////////
// Helpers
// //////////////////////////////////////////////////////////////////

const cleanOutput = (output) =>
  output
    .replace(/^ {4}/gm, '')
    .replace(/^\s*\n/gm, '')
    .trim()

const remToPx = (prop, meta) => {
  const baseFontPercentage = typeof meta.baseFontPercentage === 'number' ? meta.baseFontPercentage : 100
  const baseFontPixel = typeof meta.baseFontPixel === 'number' ? meta.baseFontPixel : 16
  return util.remToPx(prop.value, baseFontPercentage, baseFontPixel)
}

// //////////////////////////////////////////////////////////////////
// Value Transforms
// //////////////////////////////////////////////////////////////////

let VALUE_TRANSFORMS = {}

const registerValueTransform = (name, matcher, transformer) => {
  if (typeof name !== 'string') {
    throw TheoError('valueTransform name must be a string')
  }
  if (typeof matcher !== 'function') {
    throw TheoError('valueTransform matcher must be a function')
  }
  if (typeof transformer !== 'function') {
    throw TheoError('valueTransform transformer must be a function')
  }
  VALUE_TRANSFORMS[name] = {
    matcher: matcher,
    transformer: transformer
  }
}

registerValueTransform('color/rgb',
  prop => prop.type === 'color',
  prop => tinycolor(prop.value).toRgbString()
)

registerValueTransform('color/hex',
  prop => prop.type === 'color',
  prop => tinycolor(prop.value).toHexString()
)

// RRGGBBAA Hex8 notation
// As defined in the CSS spec:
// https://drafts.csswg.org/css-color-4/#hex-notation
registerValueTransform('color/hex8rgba',
  prop => prop.type === 'color',
  prop => tinycolor(prop.value).toHex8String()
)

// AARRGGBB Hex8 notation
// Useful for Android development:
// https://developer.android.com/reference/android/graphics/Color.html
registerValueTransform('color/hex8argb',
  prop => prop.type === 'color',
  prop => tinycolor(prop.value).toHex8String().replace(/^#(.{6})(.{2})/, '#$2$1')
)

registerValueTransform('percentage/float',
  prop => /%/.test(prop.value),
  prop => prop.value.replace(constants.PERCENTAGE_PATTERN, (match, number) => parseFloat(number / 100))
)

registerValueTransform('relative/pixel',
  prop => util.isRelativeSpacing(prop.value),
  (prop, meta) => remToPx(prop, meta)
)

registerValueTransform('relative/pixelValue',
  prop => util.isRelativeSpacing(prop.value),
  (prop, meta) => remToPx(prop, meta).replace(/px$/g, '')
)

// //////////////////////////////////////////////////////////////////
// Transforms
// //////////////////////////////////////////////////////////////////

let TRANSFORMS = {}

const registerTransform = (name, valueTransforms) => {
  if (typeof name !== 'string') {
    throw TheoError('transform name must be a string')
  }
  if (!Array.isArray(valueTransforms)) {
    throw TheoError('valueTransforms must be an array of registered value transforms')
  }
  valueTransforms.forEach(t => {
    if (!_.has(VALUE_TRANSFORMS, t)) {
      throw TheoError('valueTransforms must be an array of registered value transforms')
    }
  })
  TRANSFORMS[name] = valueTransforms
}

registerTransform('raw', [

])

registerTransform('web', [
  'color/rgb'
])

registerTransform('ios', [
  'color/rgb',
  'relative/pixelValue',
  'percentage/float'
])

registerTransform('android', [
  'color/hex8argb',
  'relative/pixelValue',
  'percentage/float'
])

registerTransform('aura', [
  'color/hex'
])

// //////////////////////////////////////////////////////////////////
// Formats
// //////////////////////////////////////////////////////////////////

let FORMATS = {}

const registerFormat = (name, formatter) => {
  if (typeof name !== 'string') {
    throw TheoError('format name must be a string')
  }
  if (typeof formatter !== 'function') {
    throw TheoError('format formatter must be a function')
  }
  FORMATS[name] = formatter
}

registerFormat('json', (json) => {
  let output = Object.assign(
    {},
    ...Object.keys(json.props).map(key =>
      ({[json.props[key].name]: json.props[key].value})))
  return JSON.stringify(output, null, 2)
})

registerFormat('raw.json', (json) =>
  JSON.stringify(json, null, 2))

registerFormat('ios.json', (json) => {
  let output = {
    properties: Object.keys(json.props).map(key => {
      let prop = json.props[key]
      prop.name = camelCase(prop.name)
      return prop
    })
  }
  return JSON.stringify(output, null, 2)
})

registerFormat('android.xml', (json) => {
  let getTag = (prop) => {
    if (prop.type === 'color') {
      return 'color'
    }
    return 'property'
  }
  const props = Object.keys(json.props).map(key => {
    const prop = json.props[key]
    const tag = getTag(prop)
    const name = prop.name.toUpperCase()
    return `<${tag} name="${name}" category="${prop.category}">${prop.value}</${tag}>`
  }).join('\n  ')
  let xml = `
    <?xml version="1.0" encoding="utf-8"?>
    <resources>
      ${props}
    </resources>
  `
  return cleanOutput(xml)
})

registerFormat('scss', (json) =>
  Object.keys(json.props).map(prop =>
    _.compact([
      (json.props[prop].comment ? `// ${json.props[prop].comment}` : ''),
      `$${kebabCase(json.props[prop].name)}: ${json.props[prop].value};`
    ]).join('\n')
  ).join('\n'))

registerFormat('default.scss', (json) =>
  Object.keys(json.props).map(prop =>
    _.compact([
      (json.props[prop].comment ? `// ${json.props[prop].comment}` : ''),
      `$${kebabCase(json.props[prop].name)}: ${json.props[prop].value} !default;`
    ]).join('\n')
  ).join('\n'))

registerFormat('list.scss', (json, options) => {
  let items = Array.isArray(json.items) ? json.items : []
  items = items.map(item => `"${item}"`).join(',\n  ')
  let basename = path.basename(options.path, path.extname(options.path)).replace(/\..*/g, '')
  let name = `${basename}-list`
  if (typeof options.name === 'function') {
    let n = options.name(basename, options.path)
    if (typeof n === 'string') {
      name = n
    }
  }
  let output = `
    $${name}: (
      ${items}
    );
  `
  return cleanOutput(output)
})

registerFormat('map.scss', (json, options) => {
  options = _.defaults({}, options, {
    nameSuffix: '-map'
  })
  let items = Object.keys(json.props).map(prop =>
    _.compact([
      (json.props[prop].comment ? `// ${json.props[prop].comment}` : ''),
      `"${kebabCase(json.props[prop].name)}": (${json.props[prop].value})`
    ]).join('\n  ')
  ).join(',\n  ')
  let basename = path.basename(
    options.path, path.extname(options.path)
  ).replace(/\..*/g, '')
  let name = `${basename}${options.nameSuffix}`
  if (typeof options.name === 'function') {
    let n = options.name(basename, options.path)
    if (typeof n === 'string') {
      name = n
    }
  }
  let output = `
    $${name}: (
      ${items}
    );
  `
  return cleanOutput(output)
})

registerFormat('map.variables.scss', (json, options) => {
  options = _.defaults({}, options, {
    nameSuffix: '-map-variables'
  })
  _.transform(json.props, (result, value, name, props) => {
    props[name].value = `$${kebabCase(name)}`
    props[name].type = 'variable'
  })
  return FORMATS['map.scss'](json, options)
})

registerFormat('sass', (json) =>
  Object.keys(json.props).map(prop =>
    _.compact([
      (json.props[prop].comment ? `// ${json.props[prop].comment}` : ''),
      `$${kebabCase(json.props[prop].name)}: ${json.props[prop].value}`
    ]).join('\n')
  ).join('\n'))

registerFormat('default.sass', (json) =>
  Object.keys(json.props).map(prop =>
    _.compact([
      (json.props[prop].comment ? `// ${json.props[prop].comment}` : ''),
      `$${kebabCase(json.props[prop].name)}: ${json.props[prop].value} !default`
    ]).join('\n')
  ).join('\n'))

registerFormat('less', (json) =>
  Object.keys(json.props).map(prop =>
    _.compact([
      (json.props[prop].comment ? `// ${json.props[prop].comment}` : ''),
      `@${kebabCase(json.props[prop].name)}: ${json.props[prop].value};`
    ]).join('\n')
  ).join('\n'))

registerFormat('styl', (json) =>
  Object.keys(json.props).map(prop =>
    _.compact([
      (json.props[prop].comment ? `// ${json.props[prop].comment}` : ''),
      `$${kebabCase(json.props[prop].name)} = ${json.props[prop].value}`
    ]).join('\n')
  ).join('\n'))

registerFormat('aura.theme', (json) => {
  let auraImports = Array.isArray(json.auraImports) ? json.auraImports : []
  let auraExtends = typeof json.auraExtends === 'string' ? json.auraExtends : null
  auraImports = auraImports.map(theme => {
    return `<aura:importTheme name="${theme}" />`
  }).join('\n  ')
  let props = Object.keys(json.props).map(prop =>
    `<aura:var name="${camelCase(json.props[prop].name)}" value="${json.props[prop].value}" />`
  ).join('\n  ')
  let openTag = auraExtends ? `<aura:theme extends="${auraExtends}">` : '<aura:theme>'
  let xml = `
    ${openTag}
      ${auraImports}
      ${props}
    </aura:theme>
  `
  return cleanOutput(xml)
})

registerFormat('aura.tokens', (json) => {
  let auraImports = _.toArray(json.auraImports).map(theme => {
    return `<aura:import name="${theme}" />`
  }).join('\n  ')
  let auraExtends = typeof json.auraExtends === 'string' ? json.auraExtends : null
  let props = Object.keys(json.props).map(key => {
    const prop = json.props[key]
    let name = camelCase(prop.name)
    let cssProperties = (() => {
      if (Array.isArray(prop.cssProperties)) {
        return `property="${prop.cssProperties.join(',')}"`
      }
      return ''
    })()
    return `<aura:token name="${name}" value="${prop.value}" ${cssProperties} />`
  }).join('\n  ')
  let openTag = auraExtends
    ? `<aura:tokens extends="${auraExtends}">`
    : '<aura:tokens>'
  let xml = `
    ${openTag}
      ${auraImports}
      ${props}
    </aura:tokens>
  `
  return cleanOutput(xml)
})

registerFormat('html', require('./formats/html'))

registerFormat('common.js', (json) => {
  let values = Object.keys(json.props).map(key => {
    const prop = json.props[key]
    let name = camelCase(prop.name)
    let value = prop.value
    switch (typeof value) {
      case 'string':
      default:
        value = `"${value}"`
    }
    return _.compact([
      (prop.comment ? `// ${prop.comment}` : ''),
      `${name}: ${value},`
    ]).join('\n      ')
  }).join('\n      ').replace(/,$/, '')
  let output = `
    module.exports = {
      ${values}
    };
  `
  return cleanOutput(output)
})

registerFormat('amd.js', (json) => {
  let values = Object.keys(json.props).map(key => {
    const prop = json.props[key]
    let name = camelCase(prop.name)
    let value = prop.value
    switch (typeof value) {
      case 'string':
      default:
        value = `"${value}"`
    }
    return _.compact([
      (prop.comment ? `// ${prop.comment}` : ''),
      `${name}: ${value},`
    ]).join('\n        ')
  }).join('\n        ').replace(/,$/, '')
  let output = `
    define(function() {
      return {
        ${values}
      };
    });
  `
  return cleanOutput(output)
})

// //////////////////////////////////////////////////////////////////
// Exports
// //////////////////////////////////////////////////////////////////

module.exports = {

  /**
   * Helpers that return transform streams
   */
  plugins: {
    /**
     * Push a file into a new transform stream
     *
     * @param {string} filePath
     * @return {stream}
     */
    file: (filePath) => {
      let stream = new through.obj()
      fs.readFile(filePath, (err, buffer) => {
        if (err) return stream.emit('error', err)
        let file = new gutil.File({
          path: filePath,
          contents: buffer
        })
        stream.write(file)
        stream.end()
      })
      return stream
    },
    /**
     * Transform the prop values
     *
     * @param {string} type
     * @return {stream}
     */
    transform: (type, options = {}) => {
      if (typeof options !== 'undefined' && typeof options !== 'object') {
        throw TheoError('transform() options must be an object')
      }
      if (!_.has(TRANSFORMS, type)) {
        throw TheoError(`"${type}" is not a registered transform`)
      }
      let transform = TRANSFORMS[type].map(name => VALUE_TRANSFORMS[name])
      return through.obj((file, enc, next) => {
        let newFile = file.clone()
        try {
          newFile.contents = new PropSet(newFile, transform, options).transform().toBuffer()
        } catch (err) {
          return next(err)
        }
        next(null, newFile)
      })
    },

    /**
     * Convert the vinyl '.json' file to a JSON primative
     *
     * @param {function} [callback]
     * @return {stream}
     */
    getResult: (callback) =>
      through.obj((file, enc, next) => {
        if (typeof callback === 'function' && file.isBuffer()) {
          let result = file.contents.toString()
          callback(result)
          return next(null, file)
        }
      }),

    /**
     * Format the props JSON into a new output format
     *
     * @param {string} type
     * @param {object} options
     * @param {function} [options.propsFilter] - A function that filters props before formatting
     */
    format: (type, options = {}) => {
      let defaults = {
        propsFilter: () => true,
        propsMap: prop => prop
      }
      if (typeof options !== 'object') {
        throw TheoError('format() options must be an object')
      }
      options = _.merge({}, defaults, options)
      if (typeof options.propsFilter !== 'function') {
        throw TheoError('format() options.propsFilter must be a function')
      }
      if (typeof options.propsMap !== 'function') {
        throw TheoError('format() options.propsMap must be a function')
      }
      // Get the formatter
      if (typeof FORMATS[type] === 'undefined') {
        throw TheoError(`"${type}" is not a registerd format`)
      }
      let formatter = FORMATS[type]
      return through.obj((file, enc, next) => {
        let newFile = file.clone()
        // Get the transformed JSON
        let json = util.parsePropsFile(newFile)
        // Rename the file
        newFile.path = newFile.path.replace(/(json|yml)$/, type)
        // Run filter/map the props
        let updatedProps = _(json.props)
          .filter(options.propsFilter)
          .map(options.propsMap)
          .value()
        // Convert the props to a key/value
        json.props = _.reduce(updatedProps, (props, prop) => {
          props[prop.name] = prop
          return props
        }, {})
        json.propKeys = Object.keys(json.props)
        // Format the json
        let formatted = formatter(json, _.merge({}, options, {
          path: file.path
        }))
        // Set the file contents to the result of the formatter
        newFile.contents = Buffer.from(formatted, 'utf8')
        next(null, newFile)
      })
    }

  },

  /**
   * Register a new value transform. If a transform with the provided
   * name already exists it will be overwritten
   *
   * @param {string} name
   * @param {function(prop)} filter - a function that returns a true if the transform should be applied
   * @param {function(prop,meta)} - a function that should return the new prop value
   */
  registerValueTransform,

  /**
   * Check if a value transform exists
   *
   * @param {string} name
   */
  valueTransformIsRegistered: (name) => typeof VALUE_TRANSFORMS[name] !== 'undefined',

  /**
   * Get a registered valueTransform
   *
   * @param {} name
   */
  getValueTransform: function (name) {
    if (!this.valueTransformIsRegistered(name)) {
      throw TheoError(`"${name}" is not a registered valueTransform`)
    }
    return _.merge({}, VALUE_TRANSFORMS[name])
  },

  /**
   * Register a new transform. If a transform with the provided
   * name already exists it will be overwritten
   *
   * @param {string} name
   * @param {array} valueTransforms - a list of value transforms to be applied to the props
   */
  registerTransform,

  /**
   * Check if a transform exists
   *
   * @param {string} name
   */
  transformIsRegistered: (name) => typeof TRANSFORMS[name] !== 'undefined',

  /**
   * Get a registered format
   *
   * @param {} name
   */
  getTransform: function (name) {
    if (!this.transformIsRegistered(name)) {
      throw TheoError(`"${name}" is not a registered transform`)
    }
    return _.merge([], TRANSFORMS[name])
  },

  /**
   * Register a new format. If a format with the provided
   * name already exists it will be overwritten
   *
   * @param {string} name
   * @param {function(json,[options])} formatter - a function that should return a string represenation of the new format
   */
  registerFormat,

  /**
   * Check if a transform exists
   *
   * @param {string} name
   */
  formatIsRegistered: (name) => typeof FORMATS[name] !== 'undefined',

  /**
   * Get a registered format
   *
   * @param {} name
   */
  getFormat: function (name) {
    if (!this.formatIsRegistered(name)) {
      throw TheoError(`"${name}" is not a registered format`)
    }
    return FORMATS[name]
  },

  /**
   * Transform a string to kebabCase
   *
   * @param {string} string
   */
  kebabCase
}
