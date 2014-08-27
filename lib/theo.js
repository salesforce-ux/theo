/*
Copyright (c) 2014, salesforce.com, inc. All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
Neither the name of salesforce.com, inc. nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
"use strict"

var fs = require('fs');
var util = require('util');
var path = require('path');
var handlebars = require('handlebars');
var theoUtil = require('./theoUtil');

var ALIAS_PATTERN = /\{\!(.*)\}/g;

var SPACING_SIZE_LABELS = {
  'XX_SMALL': 'xss',
  'X_SMALL' : 'xs',
  'SMALL'   : 's',
  'MEDIUM'  : 'm',
  'XX_LARGE': 'xx',
  'X_LARGE' : 'x',
  'LARGE'   : 'l',
  'NONE'    : 'n'
};

var SPACING_FORMAT_LABELS = {
  'v' : function(type, value) { return util.format('%s-top: %s; %s-bottom: %s;', type, value, type, value); },
  'h' : function(type, value) { return util.format('%s-left: %s; %s-right: %s;', type, value, type, value); },
  't' : function(type, value) { return util.format('%s-top: %s;', type, value); },
  'b' : function(type, value) { return util.format('%s-bottom: %s;', type, value); },
  'l' : function(type, value) { return util.format('%s-left: %s;', type, value); },
  'r' : function(type, value) { return util.format('%s-right: %s;', type, value); },
  'a' : function(type, value) { return util.format('%s: %s;', type, value); },
  'n' : function(type, value) { return util.format('%s: %s;', type, 0); }
};

var FILE_TYPES = {
  'Sass'    : '.scss',
  'Stylus'  : '.styl',
  'Less'    : '.less',
  'HTML'    : '.html',
  'Aura'    : '.theme',
  'JSON'    : '.json',
  'XML'     : '.xml'
};

//////////////////////////////////////////////////////////////////////////
// Utils
//////////////////////////////////////////////////////////////////////////

function convertValueFromMap(value, map, defaultValue) {
  var k, v;
  for (k in map) {
    v = map[k];
    if (value.match(k)) {
      return v;
    }
  }
  return defaultValue;
}

function remToPx(rem, baseFontPercentage, baseFontPixel) {
  return ((rem * baseFontPixel) * baseFontPercentage) + 'px';
}

/**
 * Return an array of properties that match specfied categories
 *
 * @param {object} json
 * @param {array} categories
 * @return {array}
 */
var getObjectsByCategory = function(json, categories) {
  return json.theme.properties.filter(function (property) {
    return categories.indexOf(property.category) !== -1;
  });
};

/**
 * Return a file extension for a given file type
 *
 * @param {string} type
 * @return {string}
 */
var getExtensionByType = function(type) {
  if (FILE_TYPES[type]) {
    return FILE_TYPES[type];
  }
  else {
    throw new Error('Unsupported convertion type: ' + type);
  }
};

//////////////////////////////////////////////////////////////////////////
// Handlebars Helpers (generic)
//////////////////////////////////////////////////////////////////////////

handlebars.registerHelper('dasharize', theoUtil.dasherize);
handlebars.registerHelper('camelCase', theoUtil.camelCase);

handlebars.registerHelper('addOptionalEM', function(value) {
  return !isNaN(value) ? value += 'em' : value;
});

handlebars.registerHelper('hex2rgba', function(value) {
  // convert hex colors to rgb
  if (value.indexOf('#') === 0)
    return theoUtil.hex2rgba(value.substr(1));
  else
    return value;
});

handlebars.registerHelper('if_eq', function(a, b, opts) {
  if (a == b) // Or === depending on your needs
    return opts.fn(this);
  else
    return opts.inverse(this);
});

//////////////////////////////////////////////////////////////////////////
// Handlebars Helpers (Theo defaults)
//////////////////////////////////////////////////////////////////////////

handlebars.registerHelper('iosValue', function(property, theme) {
  switch (property.category) {
    
    case 'font-size':
      if (property.value.match(/rem$/) && theme.baseFontPercentage !== undefined && theme.baseFontPixel !== undefined)
        return remToPx(property.value.replace(/rem$/, ''), theme.baseFontPercentage, theme.baseFontPixel);
      else
        return property.value;
    
    case 'color':
      return property.value.match(/^#/) ? theoUtil.hex2rgba(property.value.substr(1)) : property.value;
    
    default:
      return property.value;
  }
});

handlebars.registerHelper('spacingSizeLabel', function(value) {
  return convertValueFromMap(value, SPACING_SIZE_LABELS, 'n');
});

handlebars.registerHelper('spacingFormatLabel', function(value) {
  return convertValueFromMap(value, SPACING_FORMAT_LABELS, '');
});

//////////////////////////////////////////////////////////////////////////
// Exports
//////////////////////////////////////////////////////////////////////////

module.exports = {

  getExtensionByType: getExtensionByType,

  /**
   * Used so that scripts can register custom helpers
   */
  handlebars: handlebars,

  /**
   * Batch convert type(s) from source to destination.
   *
   * @param {string} type - String or array of strings containing the type e.g. 'Aura' or ['Aura', 'Sass']
   * @param {string} source -  Source directory path
   * @param {string} destination - Destination directory path
   */
  batch: function(type, source, destination){
    if (type instanceof Array) {
      type.forEach(function(t) {
        this.batch(t, source, destination);
      }, this);
    }
    else {
      var files = fs.readdirSync(source);
      var json, aliases, aliasesFile, result, filename;
      // Iterate over each file in the directory
      for (var i = 0; i < files.length; i++) {
        // Only load JSON files
        if (path.extname(files[i]) === '.json') {
          // Load the theme
          json = JSON.parse(fs.readFileSync(source + '/' + files[i]).toString());
          // Make sure this is a valid theme
          if (json.theme !== undefined) {
            // Reset aliases
            aliases = undefined;
            // Check if theme file has aliases defined
            if (json.theme.aliases !== undefined){
              aliasesFile = JSON.parse(fs.readFileSync(source + '/' + json.theme.aliases).toString());
              aliases = aliasesFile.aliases;
            }
            // Convert the variables
            result = this.convert(type, json, aliases);
            // Save the output
            filename = path.basename(files[i], '.json') + getExtensionByType(type);
            fs.writeFileSync(destination + '/' + filename, result);
          }
        }
      }
    };
    return null;
  },

  /**
   * Converts a JSON Object to the specified output format.
   */
  convert: function(type, variable, aliases) {
    var aliasesHash = {};
    var hasCategory = variable.theme.hasCategory = {};
    var templateFile, template, result;
    // Cache alias in hash for faster lookup
    if (aliases !== undefined) {
      if (Array.isArray(aliases)) {
        aliases.forEach(function(alias) {
          aliasesHash[alias.name] = alias.value;
        });
      }
      else {
        aliasesHash = aliases;
      }
    }
    // Resolve aliases
    variable.theme.properties.forEach(function(property) {
      var category = theoUtil.camelCase(property.category);
      // For use int the handlebars template
      if (hasCategory[category] === undefined) {
        hasCategory[category] = true;
      }
      // Check if a property is using an alias
      if (property.value.match(ALIAS_PATTERN)) {
        // Replace the alias with the actual value
        property.value = property.value.replace(ALIAS_PATTERN, function(match, alias) {
          if (aliasesHash[alias] !== undefined) {
            return aliasesHash[alias];
          }
          else {
            throw new Error('Alias "' + alias + '"" not found');
          }
        });
      }
    });
    // Get the handlebars template for the type
    templateFile = path.join(path.dirname(fs.realpathSync(__filename)), '../templates/' + type.toLowerCase() + '.hbs');
    // If the template was found
    if (fs.existsSync(templateFile)) {
      template = handlebars.compile(fs.readFileSync(templateFile).toString());
      result = template(variable.theme);
      // A Handlebar bug replaces single quotes with &#x27;
      // which has to be reverted.
      result = result.replace(/&#x27;/g, "'");
      return result;
    }
    else {
      throw new Error('No template for convertion type: ' + type);
    }
  },

  /**
   * Generate a css file with single-purpose classes
   *
   * @param {string} src
   * @param {string} dest
   */
  generateSpacings: function(src, dest) {
    // Get the theme
    var json = JSON.parse(fs.readFileSync(src).toString());
    // Return all the spacing properties that arent borders
    var spacingProperties = getObjectsByCategory(json, ['spacing']).filter(function(property) {
      return !property.name.toLowerCase().match(/(border)/g);
    });
    // Add no spacing
    spacingProperties.push({
      name: 'SPACING_NONE',
      value: 0
    });
    // Save the selectors for use in the template
    var selectors = [];
    // Create selectors for all combinations
    ['padding', 'margin'].forEach(function(spacingPrefix) {
      ['a', 'v', 'h', 'l', 'r', 't', 'b'].forEach(function(positionPrefix) {    
        spacingProperties.forEach(function(property) {
          var sizingLabel = SPACING_SIZE_LABELS[property.name.replace('SPACING_', '')];
          selectors.push({
            selector: spacingPrefix.substr(0, 1) + positionPrefix + sizingLabel,
            declaration: SPACING_FORMAT_LABELS[positionPrefix](spacingPrefix, property.value)
          });
        });
      });
    });
    // Get the template
    var templateFile = path.join(path.dirname(fs.realpathSync(__filename)), '../templates/spacing.hbs');
    var template = handlebars.compile(fs.readFileSync(templateFile).toString());
    // Execute the template
    var content = template({
      selectors: selectors
    });
    // Make sure the destination directory exists
    if (!fs.existsSync(path.dirname(dest))) {
      fs.mkdirSync(path.dirname(dest));
    }
    // Write the file
    fs.writeFileSync(dest, content);
  },

  aliasUsage: function(source) {
    var aliasFiles = [];
    var themeFiles = [];
    var aliasMap = {};
    var files = fs.readdirSync(source);
    
    files.forEach(function(file) {
      var json = JSON.parse(fs.readFileSync(source + '/' + file).toString());
      if (json.aliases !== undefined) {
        aliasFiles.push(file);
        json.aliases.forEach(function(alias) {
          aliasMap[alias.name] = 0;
        });
      }
    });
    
    files.forEach(function(file) {
      var json = JSON.parse(fs.readFileSync(source + '/' + file).toString());
      if (json.theme !== undefined) {
        themeFiles.push(file);
        json.theme.properties.forEach(function(property) {
          if (property.value.indexOf('{!') !== -1) {
            var patt = /{!(.*)}/;
            var alias = patt.exec(property.value)[1];
            if (aliasMap[alias] !== undefined) {
              aliasMap[alias]++;
            }
          }
        });
      }
    });   

    var sortable = [];
    for (var key in aliasMap) {
      sortable.push([key, aliasMap[key]]);
    }
    sortable.sort(function(a, b) {
      return b[1] - a[1];
    });

    process.stdout.write('\nAlias list pulled from the following files: ');
    aliasFiles.forEach(function(file) {
      process.stdout.write(file + ' ');
    });
    console.log('\n');
    process.stdout.write('Aliases found in the following files: ');
    themeFiles.forEach(function(file) {
      process.stdout.write(file + ' ');
    });
    console.log('\n');
    sortable.forEach(function(pair) {
      process.stdout.write(pair[0] + ':');
      for (var i = 0; i < 35 - pair[0].length; i++) {
        process.stdout.write(".");
      }
      console.log(pair[1]);
    });
  }

};