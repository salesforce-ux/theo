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
  return input.toLowerCase().replace(/_(.)/g, function(match, group1) {
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

handlebars.registerHelper('auraVar', function(options){
  return camelCase(options.fn(this));
});

handlebars.registerHelper('htmlValue', function(options){
  var value = options.fn(this);
  if(value.indexOf('#') === 0){
    return value += '<div style="width: 25px; height: 25px; background-color: ' + value + ' "></div>'
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
    case 'plist':
      return '.plist';
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

      for (var i = 0; i < files.length; i++) {
        if(path.extname(files[i]) == '.json'){
          var json = JSON.parse(fs.readFileSync(source + '/' + files[i]).toString());
          var result = this.convert(type, json);
          var filename = path.basename(files[i], '.json') + getExtensionByType(type);
          fs.writeFileSync(destination + '/' + filename, result);
        }
      }

    };
    return null;
  },

  /**
  * Converts a JSON Object to the specified output format.
  */
  convert: function(type, variable){
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
  }

};