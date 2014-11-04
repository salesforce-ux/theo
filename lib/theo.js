/*
Copyright (c) 2014, salesforce.com, inc. All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
Neither the name of salesforce.com, inc. nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
"use strict"

var fs  = require('fs');
var util = require('util');
var path = require('path');
var glob = require('glob');
var extend = require('extend');
var theoUtil = require('./util');
var prettyData = require('pretty-data').pd;
var tinycolor = require('tinycolor2');
var mkdirp = require('mkdirp');

var handlebars = require('handlebars');
    require('handlebars-helper').help(handlebars);

var ALIAS_PATTERN = /\{\!([^}]+)\}/g;
var BOX_SHADOW_PATTERN = /(\d+)(?:px)? (\d+)(?:px)? (\d+)(?:px)? ((rgba\(.*\))|#\d{3,6})/g;
var PERCENTAGE_PATTERN = /(\d+)%/g;

var CONFIG = {};

//////////////////////////////////////////////////////////////////////////
// Handlebars Helpers (generic)
//////////////////////////////////////////////////////////////////////////

handlebars.registerHelper('dasharize', theoUtil.dasherize);
handlebars.registerHelper('camelCase', theoUtil.camelCase);

handlebars.registerHelper('addOptionalEM', function(value) {
  return !isNaN(value) ? value += 'em' : value;
});

//////////////////////////////////////////////////////////////////////////
// Private methods
//////////////////////////////////////////////////////////////////////////

/**
 * Add an hash of "categories" with boolean values for the template to use
 *
 * @param {object} json
 */
function addThemeCategories(json) {
  var hasCategory = json.theme.hasCategory = {};
  json.theme.properties.forEach(function(property) {
    var category = theoUtil.camelCase(property.category);
    // For use int the handlebars template
    if (hasCategory[category] === undefined) {
      hasCategory[category] = true;
    }
  });
}

/**
 * Add resolved theme aliases
 *
 * @param {object} json
 * @param {object|array} aliases
 */
function resolveThemeAliases(json, aliases) {
  var hash = {};
  // Populate the hash with key/value pairs if the aliases are an array
  if (Array.isArray(aliases)) {
    aliases.forEach(function(alias) {
      hash[alias.name] = alias.value;
    });
  }
  else {
    hash = aliases;
  }
  // Resolve
  json.theme.properties.forEach(function(property) {
    // Check if a property is using an alias
    if (property.value.match(ALIAS_PATTERN)) {
      // Replace the alias with the actual value
      property.alias = property.value.substr(2, property.value.length - 3);
      property.value = property.value.replace(ALIAS_PATTERN, function(match, alias) {
        if (hash[alias] !== undefined) {
          return hash[alias];
        }
        else {
          throw new Error('Alias "' + alias + '"" not found');
        }
      });
    }
  });
  // Save the aliases
  json.theme.aliases = hash;
}

/**
 * Add extra values for the template to use
 *
 * @param {object} json
 * @param {object} options
 */
function addThemeTemplateValues(json, convertOptions) {
  
  function _if(condition, fn) { if (condition) { fn.call(); } }

  // Iterate over each property
  json.theme.properties.forEach(function(property) {
    
    var extras = convertOptions.extras;
    var name = property.name;
    var value = property.value;
    var match;

    var isRelativeSpacing = theoUtil.isRelativeSpacing(value);

    // iOS
    property.iosValue = value;

    // Android
    property.androidValue = value;
    property.androidTag = 'property';

    // Less
    property.lessValue = value;

    // Relative spacing
    _if(isRelativeSpacing, function() {
      var px = theoUtil.remToPx(value, extras.baseFontPercentage, extras.baseFontPixel);
      property.iosValue = px;
      property.androidValue = px;
    });

    // Colors
    _if(match = value.match(/^(#|rgb|rgba|hsv)/), function() {
      var color = tinycolor(value);
      property.iosValue = color.toRgbString();
      property.androidValue = color.toHex8String();
      property.androidTag = 'color';
      property.value = match[0] == 'hsv' ? color.toHexString() : value;
    });

    // Fonts
    _if(property.category === 'font', function() {
      var font = value.replace(/\'/g, '');
      property.iosValue = font;
      property.androidValue = font;
    });

    // Shadows
    _if(property.category.match('shadow'), function() {
      BOX_SHADOW_PATTERN.lastIndex = 0;
      if (property.value.match(BOX_SHADOW_PATTERN)) {
        var shadow = BOX_SHADOW_PATTERN.exec(property.value);
      }
    });

    // Percentages
    _if(property.value.match(/%/), function() {
      property.iosValue = property.iosValue.replace(PERCENTAGE_PATTERN, function(match, number) {
        return parseFloat(number/100);
      });
      property.androidValue = property.androidValue.replace(PERCENTAGE_PATTERN, function(match, number) {
        return parseFloat(number/100);
      });
    });

    // Decorator
    if (typeof convertOptions.beforeTemplate === 'function') {
      convertOptions.beforeTemplate.call(convertOptions, property);
    }

  });

}

/**
 * Return an array of themeData // { theme: json, name: 's1base' }
 *
 * @param {object} options - default/user options from convert
 * @return {array} themes
 */
function getThemes(convertOptions) {
  var themes = [];
  // Get the filenames of the themes to load
  var fileNames = glob.sync(convertOptions.src);
  // Iterate over each file in the directory
  fileNames.forEach(function(fileName) {
    if (path.extname(fileName) !== '.json') { return; }
    var file = fs.readFileSync(fileName);
    var json = JSON.parse(file.toString());
    if (typeof json.theme !== 'object') {
      return console.warn(util.format('%s did not contain a "theme" property', fileName));
    }
    // Categories
    addThemeCategories(json);
    // Aliases
    if (typeof json.theme.aliases === 'string') {
      var aliasesFile = fs.readFileSync(path.resolve(path.dirname(fileName), json.theme.aliases));
      var aliasesJson = JSON.parse(aliasesFile.toString());
      if (typeof aliasesJson.aliases !== 'object') {
        throw new Error(util.format('%s did not contain an "aliases" property', json.theme.aliases));
      }
      // Resolve
      resolveThemeAliases(json, aliasesJson.aliases);
    }
    if (Array.isArray(json.theme.aliases)) {
      // Resolve
      resolveThemeAliases(json, json.theme.aliases);
    }
    // Values
    addThemeTemplateValues(json, convertOptions);
    // Push
    themes.push({
      theme: json.theme,
      name: path.basename(fileName, '.json')
    });
  });
  return themes;
}

/**
 * Return an array of themeData // { theme: json, name: 's1base' }
 *
 * @param {object} themeData
 * @param {object} options
 * @param {string} template
 */
function convertTheme(themeData, options, templateName) {
  var templateFile, template, output, outputFormatted, outputName, outputExt;
  var theme = themeData.theme;
  // Save some vars for use in the handlebars templates
  theme.extras = options.extras;
  // Check if a 'templatesDirectory' config was set
  if (typeof options.templatesDirectory === 'string') {
    templateFile = path.resolve(options.templatesDirectory, templateName.toLowerCase() + '.hbs');
  }
  // If no user 'templatesDirectory' config was set, search the default templates directory
  if (!fs.existsSync(templateFile)) {
    templateFile = path.resolve(__dirname, '../', 'templates', templateName.toLowerCase() + '.hbs');
  }
  // If the template was found
  if (fs.existsSync(templateFile)) {
    // Get the template
    template = handlebars.compile(fs.readFileSync(templateFile).toString());
    output = template(theme);
    // A Handlebar bug replaces single quotes with &#x27;
    // which has to be reverted.
    output = outputFormatted = output.replace(/&#x27;/g, "'");
    // Get the file extension
    outputName = templateName.split('.');
    outputExt = outputName.pop();
    outputName.push(options.suffix);
    outputName.unshift(themeData.name);
    outputName.push(outputExt);
    outputName = outputName.filter(function(part) { return part !== ''; });
    outputName = outputName.join('.');
    // Pretty XML
    if (outputExt === 'xml') {
      outputFormatted = prettyData.xml(output);
    }
    // Pretty CSS
    if (outputExt === 'css') {
      outputFormatted = prettyData.css(output);
    }
    // Pretty JSON
    if (outputExt === 'json') {
      outputFormatted = JSON.stringify(JSON.parse(output), null, 2);
    }
    // Save the output
    mkdirp.sync(options.dest);
    fs.writeFileSync(path.resolve(options.dest, outputName), outputFormatted);
    return output;
  }
  else {
    throw new Error('No template found for : ' + templateName);
  }
}

//////////////////////////////////////////////////////////////////////////
// Exports
//////////////////////////////////////////////////////////////////////////

module.exports = {

  /**
   * Converts a JSON Object to the specified template
   *
   * @param {string} src
   * @param {string} dest
   * @param {object} [userOptions]
   * @param {string} userOptions.suffix
   * @param {object} userOptions.extras
   * @param {function} userOptions.beforeTemplate
   */
  convert: function(src, dest, userOptions) {
    if (typeof src !== 'string') {
      throw new Error('"src" must be a string');
    }
    if (typeof dest !== 'string') {
      throw new Error('"dest" must be a string');
    }
    if (typeof userOptions !== 'undefined') {
      if (typeof userOptions !== 'object') {
        throw new Error('"options" must be an object');
      }
      if (typeof userOptions.suffix !== 'undefined' && typeof userOptions.suffix !== 'string') {
        throw new Error('convert option "suffix" must be a string');
      }
      if (typeof userOptions.extras !== 'undefined' && typeof userOptions.extras !== 'object') {
        throw new Error('convert option "extras" must be an object');
      }
      if (typeof userOptions.beforeTemplate !== 'undefined' && typeof userOptions.beforeTemplate !== 'function') {
        throw new Error('convert option "beforeTemplate" must be a function');
      }
    }
    var templatesPath = path.resolve(__dirname, '../', 'templates/*.hbs');
    // Merge the user options with the defaults
    var templates = glob.sync(templatesPath).map(function(name) {
      return path.basename(name, '.hbs');
    });
    var defaults = {
      src: src,
      dest: dest,
      suffix: '',
      templates: templates,
      extras: {
        baseFontPercentage: 1.0,
        baseFontPixel: 16
      }
    };
    var options = extend({}, defaults, userOptions);
    // Get the themes
    var themes = getThemes(options);
    var convertedThemes = {};
    // Convert each theme
    themes.forEach(function(themeData) {
      var themeTemplates = convertedThemes[theoUtil.camelCase(themeData.name)] = {};
      options.templates.forEach(function(template) {
        themeTemplates[template] = convertTheme(themeData, options, template);
      });
    });
    return convertedThemes;
  },

  aliasUsage: function(source, logOutput) {
    var aliasFiles = [];
    var themeFiles = [];
    var aliasMap = {};
    var files = glob.sync(source);
    var sortedAliases = [];

    // Collect all the alias files
    files.forEach(function(file) {
      var json = JSON.parse(fs.readFileSync(file).toString());
      // Make sure this is an alias file
      if (typeof json.aliases !== 'undefined') {
        aliasFiles.push(file);
        // Each alias starts with 0 usage
        json.aliases.forEach(function(alias) {
          aliasMap[alias.name] = 0;
        });
      }
    });
    
    // Collect all the thrme files
    files.forEach(function(file) {
      var json = JSON.parse(fs.readFileSync(file).toString());
      // Make sure this is a theme file
      if (typeof json.theme !== 'undefined') {
        themeFiles.push(file);
        // Check each property for alias usage
        json.theme.properties.forEach(function(property) {
          var alias;
          if (property.value.match(ALIAS_PATTERN)) {
            while ((alias = ALIAS_PATTERN.exec(property.value)) !== null) {
              if (aliasMap[alias[1]] !== undefined) {
                aliasMap[alias[1]]++;
              }
            }
          }
        });
      }
    });   

    // Sort aliases by usage
    for (var key in aliasMap) {
      sortedAliases.push([key, aliasMap[key]]);
    }
    sortedAliases.sort(function(a, b) {
      return b[1] - a[1];
    });

    if (logOutput) {
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
      sortedAliases.forEach(function(pair) {
        process.stdout.write(pair[0] + ':');
        for (var i = 0; i < 35 - pair[0].length; i++) {
          process.stdout.write(".");
        }
        console.log(pair[1]);
      });
    }
  
    return sortedAliases;
  }

};