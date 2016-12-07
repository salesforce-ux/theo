/*
Copyright (c) 2015, salesforce.com, inc. All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
Neither the name of salesforce.com, inc. nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

let path = require('path')
let fs = require('fs')
let _ = require('lodash')
let gulpu = require('gulp-util')
let util = require('./util')
let TheoError = require('./util/error')

class PropSet {

  constructor (file, valueTransforms, options = {}) {
    if (typeof file.isBuffer !== 'function' || typeof file.isBuffer === 'undefined') {
      throw TheoError('transform() must use vinyl files')
    }

    let defaults = {
      includeRawValue: false,
      includeMeta: false,
      resolveAliases: true
    }

    this.file = file
    this.path = file.path
    this.valueTransforms = valueTransforms
    this.options = _.assign({}, defaults, options)

    this._init()
  }

  _init () {
    let {options} = this
    // Create the definition
    let def = {
      global: {},
      aliases: {}
    }
    // Merge the JSON into the definition
    try {
      let json = util.parsePropsFile(this.file)
      def = _.merge(def, json)
    } catch (e) {
      throw TheoError(`transform() encountered an invalid Design Token file: ${this.file.path}`)
    }
    // Raw
    if (options.includeRawValue === true) {
      _.forEach(def.props, prop => {
        prop['.rawValue'] = _.merge({}, prop).value
      })
    }
    // Globals
    this._resolveGlobals(def)
    // Validate
    this._validate(def)
    // Resolve any local aliases before resolving imports
    if (options.resolveAliases !== false) {
      this._resolveAliases(def)
    }
    // Collect all the import definitions
    let imports = this._resolveImports(def).map(i => i.def)
    // Merge the imported definitions
    def = _.merge.apply(null, _.flatten([{}, imports, def]))
    // Resolve any additional aliases that were depending on imports
    if (imports.length > 0 && options.resolveAliases !== false) {
      this._resolveAliases(def)
    }
    // Cleanup
    delete def.global
    delete def.imports
    // Save
    this.def = def
    return this
  }

  transform () {
    this._transformProps()
    return this
  }

  toBuffer () {
    return new Buffer(this.toJSON())
  }

  toJSON () {
    // Create a copy
    let def = _.merge({}, this.def)
    // Provide the keys for easy iteration
    def.propKeys = _.keys(def.props)
    // Go
    return JSON.stringify(def, null, 2)
  }

  _resolveGlobals (def) {
    if (_.keys(def.global).length === 0) return
    _.forEach(def.props, (prop, key) => {
      def.props[key] = _.assign({}, def.global, prop)
    })
    delete def.global
  }

  _validate (def) {
    if (_.isArray(def.props)) {
      throw TheoError('Design Token "props" key must be an object')
    }
    if (!_.has(def, 'props') || !_.isObject(def.props)) {
      // console.warn('Design Token contained no "props" object')
      def.props = {}
    }
    // Make sure properties have all required keys
    _.forEach(def.props, (prop, name) => {
      ['value', 'type', 'category'].forEach(key => {
        if (!_.has(prop, key)) {
          throw TheoError(`prop "${name}" contained no "${key}" key`)
        }
      })
    })
  }

  _resolveAliases (def) {
    let options = this.options
    _.forEach(def.aliases, (value, key) => {
      let s = _.escapeRegExp(key)
      _.forEach(def.props, prop => {
        let isAlias = new RegExp(`\{\!${s}\}`, 'g')
        let isAliasStructure = RegExp('{![^}]*}', 'g')
        if (_.isString(prop.value)) {
          // Value contains an alias
          if (isAlias.test(prop.value)) {
            // Determine if alias value is string or object
            let aliasValue = _.isString(value) ? value : value.value
            // Resolve the alias
            prop.value = prop.value.replace(isAlias, aliasValue)
          }
          if (isAliasStructure.test(prop.value)) {
            _.forEach(prop.value.match(isAliasStructure), a => {
              let alias = a.toString().replace('{!', '').replace('}', '')
              if (!def.aliases[alias]) throw new Error(`Alias ${a} not found`)
            })
          }
        }
      })
    })
  }

  _resolveImports (def) {
    if (!_.isArray(def.imports)) return []
    return def.imports.map(i => {
      let p = path.resolve(path.dirname(this.path), i)
      if (!fs.existsSync(p)) {
        throw TheoError(`Import not found: ${p}`)
      }
      let f = fs.readFileSync(p)
      if (!f) {
        throw TheoError(`Import not found: ${p}`)
      }
      let v = new gulpu.File({
        path: p,
        contents: new Buffer(f)
      })
      return new PropSet(v, this._transform, this.options)
    })
  }

  _transformProps () {
    _.forEach(this.def.props, (prop, name) => {
      // Move the name into the prop for use in the transformer
      if (!_.has(prop, 'name')) {
        prop.name = name
      }
      // Extract the meta data
      let meta = prop['.meta']
      if (this.options.includeMeta !== true) {
        delete prop['.meta']
      }
      // Transform the value
      this._transformValue(prop, meta)
    })
  }

  _transformValue (prop, meta) {
    _.forEach(this.valueTransforms, v => {
      let p = _.assign({}, prop)
      let m = _.assign({}, meta)
      if (v.matcher(p, m) === true) {
        prop.value = v.transformer(p, m)
      }
    })
  }

}

module.exports = PropSet
