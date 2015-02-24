let path        = require('path');
let fs          = require('fs');
let _           = require('lodash');
let gulpu       = require('gulp-util');
let util        = require('./util');
let TheoError   = require('./util/error');

class PropSet {
  
  constructor(file, valueTransforms, options={}) {
    if (typeof file.isBuffer !== 'function' || typeof file.isBuffer === 'undefined') {
      throw TheoError('transform() must use vinyl files');
    }

    this.file = file;
    this.path = file.path;
    this.valueTransforms = valueTransforms;
    this.options = options;

    this._init();
  }

  _init() {
    // Create the definition
    let def = {
      global: {},
      aliases: {}
    };
    // Merge the JSON into the definition
    try {
      let json = util.parsePropsFile(this.file);
      def = _.merge(def, json);
    }
    catch (e) {
      throw TheoError(`transform() encountered an invalid Design Properties file: ${this.file.path}`);
    }
    // Globals
    this._resolveGlobals(def);
    // Validate
    this._validate(def);
    // Resolve any local aliases before resolving imports
    this._resolveAliases(def);
    // Collect all the import definitions
    let imports = this._resolveImports(def).map(i => i.def);
    // Merge the imported definitions
    def = _.merge.apply(null, _.flatten([{}, imports, def]));
    // Resolve any additional aliases that were depending on imports
    if (imports.length > 0) {
      this._resolveAliases(def);
    }
    // Cleanup
    delete def.global;
    delete def.imports;
    // Save
    this.def = def;
    return this;
  }

  transform() {
    this._transformProps();
    return this;
  }

  toBuffer() {
    return new Buffer(this.toJSON());
  }

  toJSON() {
    // Create a copy
    let def = _.merge({}, this.def);
    // Provide the keys for easy iteration
    def.propKeys = _.keys(def.props);
    // Go
    return JSON.stringify(def, null, 2);
  }

  _resolveGlobals(def) {
    if (_.keys(def.global).length === 0) return;
    _.forEach(def.props, (prop, key) => {
      def.props[key] = _.merge({}, def.global, prop);
    });
    delete def.global;
  }

  _validate(def) {
    if (_.isArray(def.props)) {
      throw TheoError(`Design Properties "props" key must be an object`);
    }
    if (!_.has(def, 'props') || !_.isObject(def.props)) {
      //console.warn('Design Properties contained no "props" object')
      def.props = {};
    }
    // Make sure properties have all required keys
    _.forEach(def.props, (prop, name) => {
      ['value', 'type', 'category'].forEach(key => {
        if (!_.has(prop, key)) {
          throw TheoError(`prop "${name}" contained no "${key}" key`);
        }
      });
    });
  }

  _resolveAliases(def) {
    let options = this.options;
    _.forEach(def.aliases, (value, key) => {
      let s = _.escapeRegExp(key);
      let re = new RegExp(`{!${s}}`, 'g');
      let isAlias = /^{[^\}]*}$/g;
      _.forEach(def.props, prop => {
        if (_.isString(prop.value)) {
          // Value contains an alias
          if (re.test(prop.value)) {
            // See if the alias should be included in the prop
            if (options.includeAlias === true && isAlias.test(prop.value)) {
              prop.alias = key;
            }
            // Reslove the alias
            prop.value = prop.value.replace(re, value);
          }
        }
      });
    });
  }

  _resolveImports(def) {
    if (!_.isArray(def.imports)) return [];
    return def.imports.map(i => {
      let p = path.resolve(path.dirname(this.path), i);
      if (!fs.existsSync(p)) {
        throw TheoError(`Import not found: ${p}`);
      }
      let f = fs.readFileSync(p);
      if (!f) {
        throw TheoError(`Import not found: ${p}`);
      }
      let v = new gulpu.File({
        path: p,
        contents: new Buffer(f)
      });
      return new PropSet(v, this._transform, this.options);
    });
  }

  _transformProps() {
    _.forEach(this.def.props, (prop, name) => {
      // Move the name into the prop for use in the transformer
      if (!_.has(prop, 'name')) {
        prop.name = name;
      }
      // Extract the meta data
      let meta = prop['.meta'];
      if (this.options.includeMeta !== true) {
        delete prop['.meta'];        
      }
      // Transform the value
      this._transformValue(prop, meta);
    });
  }

  _transformValue(prop, meta) {
    _.forEach(this.valueTransforms, v => {
      let p = _.merge({}, prop);
      let m = _.merge({}, meta);
      if (v.matcher(p, m) === true) {
        prop.value = v.transformer(p, m);
      }
    });
  }

}

module.exports = PropSet;