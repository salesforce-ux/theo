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
var handlebars = require('handlebars');
var path   = require('path');

function camelCase(input) { 
  return input.toLowerCase().replace(/[_-](.)/g, function(match, group1) {
    return group1.toUpperCase();
  });
}

function hex2rgb(hex){
  return 'rgb('+parseInt(hex.substr(0, 2), 16)+','+parseInt(hex.substr(2, 2), 16)+','+parseInt(hex.substr(4, 2), 16)+')';
}

handlebars.registerHelper('sassVar', function(options){
  return '$' + options.fn(this).toLowerCase().replace(/_/g, '-');
});

handlebars.registerHelper('stylusVar', function(options){
  return options.fn(this).toLowerCase().replace(/_/g, '-');
});

handlebars.registerHelper('lessVar', function(options){
  return '@' + options.fn(this).toLowerCase().replace(/_/g, '-');
});

handlebars.registerHelper('camelCase', function(options){
  return camelCase(options.fn(this));
});

handlebars.registerHelper('addOptionalEM', function(options){
  var value = options.fn(this);
  var hasUnit = isNaN(value);
  if(!hasUnit){
    return value += 'em'
  }else{
    return value;
  }
});

handlebars.registerHelper('iOSValue', function(options){
  var value = options.fn(this);

  // convert hex colors to rgb
  if(value.indexOf('#') === 0){
    return hex2rgb(value.substr(1));
  }else{
    return value;
  }
});

handlebars.registerHelper('if_eq', function(a, b, opts) {
    if(a == b) // Or === depending on your needs
        return opts.fn(this);
    else
        return opts.inverse(this);
});

var getExtensionByType = function(type){
  switch(type){
    case 'Sass':
      return '.scss';
    case 'Stylus':
      return '.styl';
    case 'Less':
      return '.less';
    case 'HTML':
      return '.html';
    case 'Aura':
      return '.theme';
    case 'JSON':
      return '.json';
    case 'XML':
      return '.xml';
    default:
      throw new Error('Unsupported convertion type: ' + type);
  }
}

module.exports = {

  getExtensionByType: getExtensionByType,

  /**
  * Batch convert type(s) from source to destination.
  * @type String or array of strings containing the type e.g. 'Aura' or ['Aura', 'Sass']
  * @source Source directory path
  * @destination Destination directory path
  */
  batch: function(type, source, destination){
    if(type instanceof Array){
      var _this = this;
      type.forEach(function(t){
        _this.batch(t, source, destination);
      });
    }else{
      var files = fs.readdirSync(source);

      var aliases;

      for (var i = 0; i < files.length; i++) {
        if(path.extname(files[i]) == '.json'){
          var json = JSON.parse(fs.readFileSync(source + '/' + files[i]).toString());

          // Check if JSON is theme file
          if(json.theme !== undefined){

            aliases = undefined;

            // Check if theme file has aliases defined
            if(json.theme.aliases != undefined){
              var aliasesFile = JSON.parse(fs.readFileSync(source + '/' + json.theme.aliases).toString());
              aliases = aliasesFile.aliases;
            }

            var result = this.convert(type, json, aliases);
            var filename = path.basename(files[i], '.json') + getExtensionByType(type);
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
  convert: function(type, variable, aliases){
    var aliasesHash = {};

    // cache alias in hash for faster lookup
    if(aliases !== undefined && aliases.length > 0){
      aliases.forEach(function(alias){
        aliasesHash[alias.name] = alias.value;
      });
    }

    var hasCategory = {};
    variable.theme.hasCategory = hasCategory;
    // resolve aliases
    variable.theme.properties.forEach(function(property){
      var category = camelCase(property.category);

      if(hasCategory[category] === undefined){
        hasCategory[category] = true;
      }

      // if property value is an alias
      if(property.value.indexOf('{!') !== -1){
        var patt = /{!(.*)}/;
        var alias = patt.exec(property.value)[1];
        if(aliasesHash[alias]){
          property.value = property.value.replace(alias, aliasesHash[alias]);
          property.value = property.value.replace('{!', '');
          property.value = property.value.replace('}', '');
        }else{
          throw new Error('Alias "' + alias + '"" not found');
        }

      }
    });

    var templateFile = path.join(path.dirname(fs.realpathSync(__filename)), '../templates/' + type.toLowerCase() + '.hbs');
    if(fs.existsSync(templateFile)){
      var template = handlebars.compile(fs.readFileSync(templateFile).toString());
      var result = template(variable.theme);

      // A Handlebar bug replaces single quotes with &#x27;
      // which has to be reverted.
      result = result.replace(/&#x27;/g, "'");
      return result;
    }else{
      throw new Error('No template for convertion type: ' + type);
    }
  },

  alias_usage: function(source) {
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

    process.stdout.write('Alias list pulled from the following files: ');
    aliasFiles.forEach(function(file) {
      process.stdout.write(file + ' ');
    });
    console.log('');
    process.stdout.write('Aliases used in the following files: ');
    themeFiles.forEach(function(file) {
      process.stdout.write(file + ' ');
    });
    console.log('');
    sortable.forEach(function(pair) {
      process.stdout.write(pair[0] + ':');
      for (var i = 0; i < 35 - pair[0].length; i++) {
        process.stdout.write(".");
      }
      console.log(pair[1]);
    });
  }

};