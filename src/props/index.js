/*
Copyright (c) 2015, salesforce.com, inc. All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
Neither the name of salesforce.com, inc. nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

let path        = require('path');
let fs          = require('fs');
let _           = require('lodash');
let through     = require('through2');
let gulpu       = require('gulp-util');
let tinycolor   = require('tinycolor2');

let util        = require('./util');
let constants   = require('./util/constants');
let TheoError   = require('./util/error');

let PropSet     = require('./prop-set');

let kebabCase   = require('lodash/string/kebabCase');
let camelCase   = require('lodash/string/camelCase');

////////////////////////////////////////////////////////////////////
// Helpers
////////////////////////////////////////////////////////////////////

function cleanOutput(output) {
  return output
    .replace(/^    /gm, '')
    .replace(/^\s*\n/gm, '')
    .trim();
}

function remToPx(prop, meta) {
  let baseFontPercentage = typeof meta.baseFontPercentage === 'number' ? meta.baseFontPercentage : 100;
  let baseFontPixel = typeof meta.baseFontPixel === 'number' ? meta.baseFontPixel : 16;
  return util.remToPx(prop.value, baseFontPercentage, baseFontPixel);
}

////////////////////////////////////////////////////////////////////
// Value Transforms
////////////////////////////////////////////////////////////////////

let VALUE_TRANSFORMS = {};

function registerValueTransform(name, matcher, transformer) {
  if (typeof name !== 'string') {
    throw TheoError('valueTransform name must be a string');
  }
  if (typeof matcher !== 'function') {
    throw TheoError('valueTransform matcher must be a function');
  }
  if (typeof transformer !== 'function') {
    throw TheoError('valueTransform transformer must be a function');
  }
  VALUE_TRANSFORMS[name] = {
    matcher: matcher,
    transformer: transformer
  };
}

registerValueTransform('color/rgb',
  prop => prop.type === 'color',
  prop => tinycolor(prop.value).toRgbString()
);

registerValueTransform('color/hex',
  prop => prop.type === 'color',
  prop => tinycolor(prop.value).toHexString()
);

registerValueTransform('color/hex8',
  prop => prop.type === 'color',
  prop => tinycolor(prop.value).toHex8String()
);

registerValueTransform('percentage/float',
  prop => /%/.test(prop.value),
  prop => prop.value.replace(constants.PERCENTAGE_PATTERN, (match, number) => parseFloat(number/100))
);

registerValueTransform('relative/pixel',
  prop => util.isRelativeSpacing(prop.value),
  (prop, meta) => remToPx(prop, meta)
);

registerValueTransform('relative/pixelValue',
  prop => util.isRelativeSpacing(prop.value),
  (prop, meta) => remToPx(prop, meta).replace(/px$/g, '')
);

////////////////////////////////////////////////////////////////////
// Transforms
////////////////////////////////////////////////////////////////////

let TRANSFORMS = {};

function registerTransform(name, valueTransforms) {
  if (typeof name !== 'string') {
    throw TheoError('transform name must be a string');
  }
  if (!_.isArray(valueTransforms)) {
    throw TheoError('valueTransforms must be an array of registered value transforms');
  }
  valueTransforms.forEach(t => {
    if (!_.has(VALUE_TRANSFORMS, t)) {
      throw TheoError('valueTransforms must be an array of registered value transforms');
    }
  });
  TRANSFORMS[name] = valueTransforms;
}

registerTransform('raw', [

]);

registerTransform('web', [
  'color/rgb'
]);

registerTransform('ios', [
  'color/rgb',
  'relative/pixelValue',
  'percentage/float'
]);

registerTransform('android', [
  'color/hex8',
  'relative/pixelValue',
  'percentage/float'
]);

registerTransform('aura', [
  'color/hex'
]);

////////////////////////////////////////////////////////////////////
// Formats
////////////////////////////////////////////////////////////////////

let FORMATS = {};

function registerFormat(name, formatter) {
  if (typeof name !== 'string') {
    throw TheoError('format name must be a string');
  }
  if (typeof formatter !== 'function') {
    throw TheoError('format formatter must be a function');
  }
  FORMATS[name] = formatter;
}

registerFormat('json', json => {
  let output = {};
  _.forEach(json.props, prop => {
    output[prop.name] = prop.value;
  });
  return JSON.stringify(output, null, 2);
});

registerFormat('raw.json', json => {
  return JSON.stringify(json, null, 2);
});

registerFormat('ios.json', json => {
  let output = {
    properties: _.map(json.props, prop => {
      prop.name = camelCase(prop.name);
      return prop;
    })
  };
  return JSON.stringify(output, null, 2);
});

registerFormat('android.xml', json => {
  let getTag = (prop) => {
    if (prop.type === 'color')
      return 'color';
    return 'property';
  };
  let props = _.map(json.props, prop => {
    let tag = getTag(prop);
    let name = prop.name.toUpperCase();
    return `<${tag} name="${name}" category="${prop.category}">${prop.value}</${tag}>`;
  }).join('\n  ');
  let xml = `
    <?xml version="1.0" encoding="utf-8"?>
    <resources>
      ${props}
    </resources>
  `;
  return cleanOutput(xml);
});

registerFormat('scss', json => {
  return _.map(json.props, prop => {
    let name = kebabCase(prop.name);
    return `$${name}: ${prop.value};`;
  }).join('\n');
});

registerFormat('default.scss', json => {
  return _.map(json.props, prop => {
    let name = kebabCase(prop.name);
    return `$${name}: ${prop.value} !default;`;
  }).join('\n');
});

registerFormat('list.scss', (json, options) => {
  let items = _.isArray(json.items) ? json.items : [];
  items = _.map(items, item => {
    return `"${item}"`;
  }).join(',\n  ');
  let basename = path.basename(options.path, path.extname(options.path)).replace(/\..*/g, '');
  let name = `${basename}-list`;
  if (_.isFunction(options.name)) {
    let n = options.name(basename, options.path);
    if (_.isString(n)) {
      name = n;
    }
  }
  let output = `
    $${name}: (
      ${items}
    );
  `;
  return cleanOutput(output);
});

registerFormat('map.scss', (json, options) => {
  options = _.defaults({}, options, {
    nameSuffix: '-map' 
  });
  let items = _.map(json.props, prop => {
    let name = kebabCase(prop.name);
    return `"${name}": (${prop.value})`;
  }).join(',\n  ');
  let basename = path.basename(
    options.path, path.extname(options.path)
  ).replace(/\..*/g, '');
  let name = `${basename}${options.nameSuffix}`;
  if (_.isFunction(options.name)) {
    let n = options.name(basename, options.path);
    if (_.isString(n)) {
      name = n;
    }
  }
  let output = `
    $${name}: (
      ${items}
    );
  `;
  return cleanOutput(output);
});

registerFormat('map.variables.scss', (json, options) => {
  options = _.defaults({}, options, {
    nameSuffix: '-map-variables' 
  });
  _.transform(json.props, (result, value, name, props) => {
    props[name].value = `$${kebabCase(name)}`;
    props[name].type = 'variable';
  });
  return FORMATS['map.scss'](json, options);
});

registerFormat('sass', json => {
  return _.map(json.props, prop => {
    let name = kebabCase(prop.name);
    return `$${name}: ${prop.value}`;
  }).join('\n');
});

registerFormat('default.sass', json => {
  return _.map(json.props, prop => {
    let name = kebabCase(prop.name);
    return `$${name}: ${prop.value} !default`;
  }).join('\n');
});

registerFormat('less', json => {
  return _.map(json.props, prop => {
    let name = kebabCase(prop.name);
    return `@${name}: ${prop.value};`;
  }).join('\n');
});

registerFormat('styl', json => {
  return _.map(json.props, prop => {
    let name = kebabCase(prop.name);
    return `${name} = ${prop.value}`;
  }).join('\n');
});

registerFormat('aura.theme', json => {
  let auraImports = _.isArray(json.auraImports) ? json.auraImports : [];
  let auraExtends = _.isString(json.auraExtends) ? json.auraExtends : null;
  auraImports = auraImports.map(theme => {
    return `<aura:importTheme name="${theme}" />`;
  }).join('\n  ');
  let props = _.map(json.props, prop => {
    let name = camelCase(prop.name);
    return `<aura:var name="${name}" value="${prop.value}" />`;
  }).join('\n  ');
  let openTag = auraExtends ? `<aura:theme extends="${auraExtends}">` : `<aura:theme>`;
  let xml = `
    ${openTag}
      ${auraImports}
      ${props}
    </aura:theme>
  `;
  return cleanOutput(xml);
});

registerFormat('aura.tokens', json => {
  let auraImports = _.toArray(json.auraImports).map(theme => {
    return `<aura:import name="${theme}" />`;
  }).join('\n  ');
  let auraExtends = _.isString(json.auraExtends) ? json.auraExtends : null;
  let props = _.map(json.props, prop => {
    let name = camelCase(prop.name);
    let cssProperties = (() => {
      if (_.isArray(prop.cssProperties)) {
        return `property="${prop.cssProperties.join(',')}"`;
      }
      return ''
    })()
    return `<aura:token name="${name}" value="${prop.value}" ${cssProperties} />`;
  }).join('\n  ');
  let openTag = auraExtends
    ? `<aura:tokens extends="${auraExtends}">`
    : `<aura:tokens>`;
  let xml = `
    ${openTag}
      ${auraImports}
      ${props}
    </aura:tokens>
  `;
  return cleanOutput(xml);
});

registerFormat('html', require('./formats/html'));

registerFormat('common.js', json => {
  let values = _.map(json.props, prop => {
    let name = camelCase(prop.name);
    let value = prop.value;
    switch (typeof value) {
      case 'string':
      default:
        value = `"${value}"`;
    }
    return `${name}: ${value},`;
  }).join('\n  ').replace(/,$/, '');
  let output = `
    module.exports = {
      ${values}
    };
  `;
  return cleanOutput(output);
});

registerFormat('amd.js', json => {
  let values = _.map(json.props, prop => {
    let name = camelCase(prop.name);
    let value = prop.value;
    switch (typeof value) {
      case 'string':
      default:
        value = `"${value}"`;
    }
    return `${name}: ${value},`;
  }).join('\n  ').replace(/,$/, '');
  let output = `
    define(function() {
      return {
        ${values}
      };
    });
  `;
  return cleanOutput(output);
});

////////////////////////////////////////////////////////////////////
// Exports
////////////////////////////////////////////////////////////////////

module.exports = {

  /**
   * Helpers that return transform streams
   */
  plugins: {

    /**
     * Transform the prop values
     *
     * @param {string} type
     */
    transform(type, options={}) {
      if (typeof options !== 'undefined' && typeof options !== 'object') {
        throw TheoError('transform() options must be an object');
      }
      if (!_.has(TRANSFORMS, type)) {
        let err = TheoError(`"${type}" is not a registered transform`);
        return next(err);
      }
      let transform = TRANSFORMS[type].map(name => VALUE_TRANSFORMS[name]);
      return through.obj((file, enc, next) => {
        let newFile = file.clone();
        try {
          newFile.contents = new PropSet(newFile, transform, options).transform().toBuffer();
        }
        catch(err) {
          return next(err);
        }
        next(null, newFile);
      });
    },

    /**
     * Convert the vinyl '.json' file to a JSON primative
     *
     * @param {function} [callback]
     * @return {stream}
     */    
    getResult(callback) {
      return through.obj((file, enc, next) => {
        if (typeof callback === 'function' && file.isBuffer()) {
          let result = file.contents.toString();
          callback(result);
          return next(null, file);
        }
      });
    },

    /**
     * Format the props JSON into a new output format
     *
     * @param {string} type
     * @param {object} options
     * @param {function} [options.propsFilter] - A function that filters props before formatting
     */
    format(type, options={}) {
      let defaults = {
        propsFilter: () => true,
        propsMap: prop => prop
      };
      if (typeof options !== 'object') {
        throw TheoError('format() options must be an object');
      }
      options = _.merge({}, defaults, options);
      if (typeof options.propsFilter !== 'function') {
        throw TheoError('format() options.propsFilter must be a function');
      }
      if (typeof options.propsMap !== 'function') {
        throw TheoError('format() options.propsMap must be a function');
      }
      // Get the formatter
      if (typeof FORMATS[type] === 'undefined') {
        throw TheoError(`"${type}" is not a registerd format`);
      }
      let formatter = FORMATS[type];
      return through.obj((file, enc, next) => {
        let newFile = file.clone();
        // Get the transformed JSON
        let json = util.parsePropsFile(newFile);
        // Rename the file
        newFile.path = newFile.path.replace(/(json|yml)$/, type);
        // Run filter/map the props
        let updatedProps = _(json.props)
          .filter(options.propsFilter)
          .map(options.propsMap)
          .value();
        // Convert the props to a key/value
        json.props = _.reduce(updatedProps, (props, prop) => {
          props[prop.name] = prop;
          return props;
        }, {});
        json.propKeys = _.keys(json.props);
        // Format the json
        let formatted = formatter(json, _.merge({}, options, {
          path: file.path
        }));
        // Set the file contents to the result of the formatter
        newFile.contents = new Buffer(formatted);
        next(null, newFile);
      });
    },

    /**
     * Diff props
     */
    diff(options={}) {
      let defaults = {
        name: 'diff'
      };
      if (typeof options !== 'object') {
        throw TheoError('diff() options must be an object');
      }
      options = _.merge({}, defaults, options);
      if (typeof options.name !== 'string') {
        throw TheoError('diff() options.name must be a string');
      }
      let propSets = [];
      function transform(file, enc, next) {
        let ext = path.extname(file.relative);
        if (ext === '.json' || ext === '.yml') {
          try {
            let json = util.parsePropsFile(file);
            propSets.push(json);
          } catch(e) {
            let err = TheoError('diff() encountered an invalid Design Properties file', file.path);
            return next(err);
          }
        }
        next();
      }
      function flush(next) {
        let log = {
          changed: {},
          added: {},
          removed: {}
        };
        let a = propSets[0].props;
        let b = propSets[1].props;
        _.forEach(a, (prop, name) => {
          // Change
          if (_.has(b, name)) {
            let _prop = b[name];
            if (prop.value !== _prop.value) {
              log.changed[name] = [prop.value, _prop.value];
            }
          }
          // Remove
          else {
            log.removed[name] = prop.value;
          }
        });
        _.forEach(b, (prop, name) => {
          // Add
          if (!_.has(a, name)) {
            log.added[name] = prop.value;
          }
        });
        let file = new gulpu.File({
          path: `${options.name}.json`,
          contents: new Buffer(JSON.stringify(log, null, 2))
        });
        this.push(file);
        next();
      }
      return through.obj(transform, flush);
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
  valueTransformIsRegistered(name) {
    return typeof VALUE_TRANSFORMS[name] !== 'undefined';
  },

  /**
   * Get a registered valueTransform
   *
   * @param {} name
   */
  getValueTransform(name) {
    if (!this.valueTransformIsRegistered(name)) {
      throw TheoError(`"${name}" is not a registered valueTransform`);
    }
    return _.merge({}, VALUE_TRANSFORMS[name]);
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
  transformIsRegistered(name) {
    return typeof TRANSFORMS[name] !== 'undefined';
  },

  /**
   * Get a registered format
   *
   * @param {} name
   */
  getTransform(name) {
    if (!this.transformIsRegistered(name)) {
      throw TheoError(`"${name}" is not a registered transform`);
    }
    return _.merge([], TRANSFORMS[name]);
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
  formatIsRegistered(name) {
    return typeof FORMATS[name] !== 'undefined';
  },

  /**
   * Get a registered format
   *
   * @param {} name
   */
  getFormat(name) {
    if (!this.formatIsRegistered(name)) {
      throw TheoError(`"${name}" is not a registered format`);
    }
    return FORMATS[name];
  }

};
