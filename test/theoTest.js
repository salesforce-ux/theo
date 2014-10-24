/*
Copyright (c) 2014, salesforce.com, inc. All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
Neither the name of salesforce.com, inc. nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
var should = require('should');
var assert = require('assert');
var fs     = require('fs');
var path   = require('path');
var glob   = require('glob');

var theo   = require('./../lib/theo');

// Helper to clean a directory
function clean(dir) {
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir).forEach(function(fileName) {
      fs.unlinkSync(path.resolve(dir, fileName));
    });
  }
}

describe('theo', function() {

  describe('#aliasUsage()', function() {
    it('collects alias usage', function() {
      var aliases = theo.aliasUsage('./test/mock/*.json');
      aliases.should.have.length(3);
      var aliasesWithZeroUsage = aliases.filter(function(alias) {
        if (alias[1] === 0) {
          return alias;
        }
      });
      aliasesWithZeroUsage.should.have.length(1);
      aliasesWithZeroUsage[0][0].should.equal('black');
    });
  });

  describe('#convert()', function() {

    before(function() {
      clean('./dist');
    });

    describe('options', function() {
      var result;

      before(function() {
        clean('./dist');
      });

      it('throw an error if no source directory is provided', function() {
        (function(){
          theo.convert();
        }).should.throw();
      });

      it('throw an error if no destination directory is provided', function() {
        (function(){
          theo.convert('./test/mock/s1base.json');
        }).should.throw();
      });

      it('throw an error if options is not an object', function() {
        (function(){
          theo.convert('./test/mock/s1base.json', './dist', 'foobar');
        }).should.throw();
      });

      it('throw an error if options.suffix is not a string', function() {
        (function(){
          theo.convert('./test/mock/s1base.json', './dist', {
            suffix: {}
          });
        }).should.throw();
      });

      it('throw an error if options.extras is not an object', function() {
        (function(){
          theo.convert('./test/mock/s1base.json', './dist', {
            extras: ''
          });
        }).should.throw();
      });

      it('throw an error if options.beforeTemplate is not a function', function() {
        (function(){
          theo.convert('./test/mock/s1base.json', './dist', {
            beforeTemplate: {}
          });
        }).should.throw();
      });

      it('throw an error if the template cannot be found', function() {
        (function(){
          theo.convert('./test/mock/s1base.json', './dist', {
            templates: ['foo']
          });
        }).should.throw();
      });

      it('throw an error if any properties are missing categories', function () {
        (function() {
          theo.convert('./test/mock/error/missing_category.json', './dist', {
            templates:['less']
          });
        }).should.throw();
      });

      it('search the "templatesDirectory" for templates', function() {
        var foo = path.resolve(__dirname, 'mock/templates/foo.hbs');
        fs.writeFileSync(foo, '');
        (function(){
          result = theo.convert('./test/mock/s1base.json', './dist', {
            templatesDirectory: path.resolve(__dirname, 'mock/templates'),
            templates: ['foo']
          });
        }).should.not.throw();
        fs.unlinkSync(foo);
      });

      it('allow templates in "templatesDirectory" to override default templates', function() {
        var scss = path.resolve(__dirname, 'mock/templates/scss.hbs');
        fs.writeFileSync(scss, '');
        result = theo.convert('./test/mock/s1base.json', './dist', {
          templatesDirectory: path.resolve(__dirname, 'mock/templates'),
          templates: ['scss']
        });
        result.s1base['scss'].should.equal('');
        fs.unlinkSync(scss);
      });

      it('inject values into the template if "beforeTemplate" is implemented', function() {
        result = theo.convert('./test/mock/s1base.json', './dist', {
          templates: ['scss'],
          beforeTemplate: function(property) {
            property.value = 'testValue';
          }
        });
        result.s1base['scss'].should.containEql('$color-curious-blue: testValue;');
      });

      it('only parse json files with a "theme" node', function() {
        (function(){
          theo.convert('./test/mock/*.json', './dist');
        }).should.not.throw();
      });

    });

    describe('convert Sass', function() {

      var result;

      it('should convert a variables object to Sass', function() {
        result = theo.convert('./test/mock/s1base.json', './dist', {
          templates: ['scss']
        });
        result.s1base['scss'].should.exist;
        result.s1base['scss'].should.containEql('$color-curious-blue: #2a94d6;');
      });

      it('should save the output file', function() {
        assert(fs.existsSync('./dist/s1base.scss')); 
      });

    });

    describe('convert Stylus', function() {

      var result;

      it('should convert a variables object to Stylus', function() {
        result = theo.convert('./test/mock/s1base.json', './dist', {
          templates: ['styl']
        });
        result.s1base['styl'].should.exist;
        result.s1base['styl'].should.containEql('color-curious-blue = #2a94d6');
      });

      it('should save the output file', function() {
        assert(fs.existsSync('./dist/s1base.styl')); 
      });

    });

    describe('convert Less', function() {

      var result;

      it('should convert a variables object to Less', function() {
        result = theo.convert('./test/mock/s1base.json', './dist', {
          templates: ['less']
        });
        result.s1base['less'].should.exist;
        result.s1base['less'].should.containEql('@color-curious-blue: #2a94d6;');
      });

      it('should save the output file', function() {
        assert(fs.existsSync('./dist/s1base.less')); 
      });

    });

    describe('convert Aura', function() {

      var result;

      it('should convert a variables object to an Aura theme token', function() {
        result = theo.convert('./test/mock/s1base.json', './dist', {
          templates: ['theme']
        });
        result.s1base['theme'].should.containEql('<aura:theme >');
        result.s1base['theme'].should.containEql('<aura:var name="colorCuriousBlue" value="#2a94d6" />');
      });

      it('should preserve single quotes', function() {
        result.s1base['theme'].should.containEql('<aura:var name="fontBold" value="\'ProximaNovaSoft-Bold\'" />');
      });

      it('should add extends if JSON is extending a base', function() {
        result.s1base['theme'].should.containEql('<aura:var name="colorWhite" value="#ffffff" />');
      });

      it('should add extends if JSON is extending a base', function() {
        var result = theo.convert('./test/mock/s1sub.json', './dist', {
          templates: ['theme']
        });
        result.s1sub['theme'].should.containEql('<aura:theme extends="one:theme">');
      });

      it('should add extends if JSON is extending a base', function() {
        var result = theo.convert('./test/mock/s1sub.json', './dist', {
          templates: ['theme']
        });
        result.s1sub['theme'].should.containEql('<aura:importTheme name="one:mqCommons"/>');
      });

      it('should save the output file', function() {
        assert(fs.existsSync('./dist/s1base.theme')); 
      });

    });

    describe('convert JSON', function() {

      var result;

      it('should convert a variables object to JSON', function() {
        result = theo.convert('./test/mock/s1base.json', './dist', {
          suffix: 'phone',
          templates: ['ios.json'],
          extras: {
            baseFontPercentage: 0.625,
            baseFontPixel: 16
          }
        });
        result.s1base['ios.json'].should.exist;
      });

      it('converts colors to rgba', function() {
        result.s1base['ios.json'].replace(/  /g, '').should.containEql('"name": "colorCuriousBlue",\n"value": "rgb(42, 148, 214)"');
      });

      it('converts rems to pixels', function() {
        result.s1base['ios.json'].replace(/  /g, '').should.containEql('"name": "textLargest",\n"value": "22px"');
      });

      it('should be valid JSON', function() {
        (function(){
          JSON.parse(result.s1base['ios.json']);
        }).should.not.throw();
      });

      it('should resolve aliases inside a value', function(){
        result.s1base['ios.json'].replace(/  /g, '').should.containEql('"name": "shadowStrong",\n"value": "0 1px 3px rgba(0,0,0,.2)"');
      });

      it('should save the output file with the correct suffix', function() {
        assert(fs.existsSync('./dist/s1base.ios.phone.json')); 
      });

    });

    describe('convert XML', function() {

      var result;

      it('should convert a variables object to XML', function() {
        result = theo.convert('./test/mock/s1base.json', './dist', {
          suffix: 'phone',
          templates: ['android.xml'],
          extras: {
            baseFontPercentage: 0.625,
            baseFontPixel: 16
          }
        });
        result.s1base['android.xml'].should.exist;
      });

      it('creates a color tag with hext8 value', function() {
        result.s1base['android.xml'].should.containEql('<color name="COLOR_CURIOUS_BLUE">#ff2a94d6</color>');
      });

      it('converts rems to pixels', function() {
        result.s1base['android.xml'].should.containEql('<property name="TEXT_LARGEST">22px</property>');
      });

      it('should resolve aliases inside a value', function(){
        result.s1base['android.xml'].should.containEql('<color name="COLOR_WHITE">#ffffffff</color>');
      });

      it('should save the output file with the correct suffix', function() {
        assert(fs.existsSync('./dist/s1base.android.phone.xml')); 
      });

    });

    describe('convert HTML', function() {

      var result;

      it('should convert a variables object to XML', function() {
        result = theo.convert('./test/mock/s1base.json', './dist', {
          templates: ['html']
        });
        result.s1base['html'].should.exist;
        result.s1base['html'].should.containEql('<html>');
      });

      it('should save the output file', function() {
        assert(fs.existsSync('./dist/s1base.html')); 
      });

      it('should add line-height units to HTML documentation if not present', function(){
        result.s1base['html'].should.containEql('line-height: 1.5');
        result.s1base['html'].should.containEql('background-size: 100% 1.5em');
      });

    });

    describe('default', function() {
      var result;

      before(function() {
        clean('./dist');
      });

      it('should save an output file for each template', function() {
        result = theo.convert('./test/mock/s1base.json', './dist');
        // Get all the template names
        var templateNames = glob.sync('./templates/*.hbs').map(function(fileName) {
          return 's1base.' + path.basename(fileName, '.hbs');
        });
        // Map the outfile to a boolean indcating whether or not it was in the templates dir
        var outputNames = glob.sync('./dist/*').map(function(fileName) {
          return templateNames.indexOf(path.basename(fileName)) !== -1;
        });
        // Finally, make sure the number of "trues" is the sames as the number of templates
        var matches = outputNames.filter(function(match) {
          return match === true;
        });
        matches.should.have.length(templateNames.length)
      });
    });
  });
});
