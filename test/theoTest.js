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

var theo = require('./../lib/theo');

describe('theo', function(){

  beforeEach(function(done){
    if(fs.existsSync('./dist')){
      fs.readdirSync('./dist').forEach(function(fileName) {
        //fs.unlinkSync('./dist/' + fileName);
      });
    }
    if(!fs.existsSync('./dist')){
      fs.mkdirSync('./dist');
    }
    done();
  });

  after(function(){
    theo.batch(['Aura', 'Sass' , 'Stylus', 'Less', 'plist', 'XML', 'HTML'], './test/mock', 'dist');

    assert(fs.existsSync('./dist/s1base.theme'), 'one.theme was not created.');
    assert(fs.existsSync('./dist/s1sub.theme'), 's1sub.theme was not created.');
    assert(fs.existsSync('./dist/s1base.scss'), 's1base.scss was not created.');
    assert(fs.existsSync('./dist/s1sub.scss'), 's1sub.scss was not created.');
    assert(fs.existsSync('./dist/s1base.styl'), 's1base.styl was not created.');
    assert(fs.existsSync('./dist/s1sub.styl'), 's1sub.scss was not created.');
    assert(fs.existsSync('./dist/s1base.less'), 's1base.less was not created.');
    assert(fs.existsSync('./dist/s1sub.less'), 's1sub.less was not created.');
    assert(fs.existsSync('./dist/s1base.plist'), 's1base.plist was not created.');
    assert(fs.existsSync('./dist/s1base.xml'), 's1base.xml was not created.');
  });

  describe('batch', function(){
    it('should convert an array of variables to theme tokens.', function(){
      theo.batch('Aura', './test/mock', 'dist');
      theo.batch('Sass', './test/mock', 'dist');
      theo.batch('Stylus', './test/mock', 'dist');
      theo.batch('Less', './test/mock', 'dist');
      theo.batch('plist', './test/mock', 'dist');
      theo.batch('XML', './test/mock', 'dist');

      assert(fs.existsSync('./dist/s1base.theme'), 'one.theme was not created.');
      assert(fs.existsSync('./dist/s1sub.theme'), 's1sub.theme was not created.');
      assert(fs.existsSync('./dist/s1base.scss'), 's1base.scss was not created.');
      assert(fs.existsSync('./dist/s1sub.scss'), 's1sub.scss was not created.');
      assert(fs.existsSync('./dist/s1base.styl'), 's1base.styl was not created.');
      assert(fs.existsSync('./dist/s1sub.styl'), 's1sub.styl was not created.');
      assert(fs.existsSync('./dist/s1base.less'), 's1base.less was not created.');
      assert(fs.existsSync('./dist/s1sub.less'), 's1sub.less was not created.');
      assert(fs.existsSync('./dist/s1base.plist'), 's1base.plist was not created.');
      assert(fs.existsSync('./dist/s1base.xml'), 's1base.xml was not created.');
    });
  });

  describe('convert Sass', function(){

    it('should convert a variables object to Sass.', function(){
      s1Base = JSON.parse(fs.readFileSync('./test/mock/s1base.json').toString());
      var result = theo.convert('Sass', s1Base);
      assert(result, 'result does not exist');
      assert(result.indexOf('$color-primary: #2a94d6;') != -1, 'Could not find primary color.');
    });

  });

  describe('convert Stylus', function(){

    it('should convert a variables object to Stylus.', function(){
      s1Base = JSON.parse(fs.readFileSync('./test/mock/s1base.json').toString());
      var result = theo.convert('Stylus', s1Base);
      assert(result, 'result does not exist');
      //console.log(result);
      assert(result.indexOf('color-primary = #2a94d6') != -1, 'Could not find primary color.');
    });

  });

  describe('convert Less', function(){

    it('should convert a variables object to Less.', function(){
      s1Base = JSON.parse(fs.readFileSync('./test/mock/s1base.json').toString());
      var result = theo.convert('Less', s1Base);
      assert(result, 'result does not exist');
      //console.log(result);
      assert(result.indexOf('@color-primary: #2a94d6;') != -1, 'Could not find primary color.');
    });

  });

  describe('convert Aura', function(){
    
    it('should convert a variables object to a theme token.', function(){
      json = JSON.parse(fs.readFileSync('./test/mock/s1base.json').toString());
      var result = theo.convert('Aura', json);
      assert(result, 'result does not exist');
      assert(result.indexOf('<aura:theme >') != -1, 'Could not find main aura tag.');
      assert(result.indexOf('<aura:var name="colorPrimary" value="#2a94d6" />') != -1, 'Could not find primary color.');
    });

    it('should add extends if JSON is extending a base.', function(){
      json = JSON.parse(fs.readFileSync('./test/mock/s1sub.json').toString());
      var result = theo.convert('Aura', json);
      assert(result.indexOf('<aura:theme extends="one:theme">') != -1, 'Could not find main aura tag with extends.');
    });

  });

  describe('convert plist', function(){
    
    it('should convert a variables object to a plist.', function(){
      json = JSON.parse(fs.readFileSync('./test/mock/s1base.json').toString());
      var result = theo.convert('plist', json);
      assert(result, 'result does not exist');
      assert(result.indexOf('<key>COLOR_PRIMARY</key>') != -1, 'Could not find primary color.');
      assert(result.indexOf('<string>#2a94d6</string>') != -1, 'Could not find primary color value.');
    });

  });

  describe('convert XML', function(){
    
    it('should convert a variables object to XML.', function(){
      json = JSON.parse(fs.readFileSync('./test/mock/s1base.json').toString());
      var result = theo.convert('XML', json);
      assert(result, 'result does not exist');
      assert(result.indexOf('<variable name="COLOR_PRIMARY" value="#2a94d6" />') != -1, 'Could not find primary color.');
    });

  });

  describe('convert HTML', function(){
    
    it('should convert a variables object to a HTML documentation.', function(){
      json = JSON.parse(fs.readFileSync('./test/mock/s1base.json').toString());
      var result = theo.convert('HTML', json);
      assert(result, 'result does not exist');
      assert(result.indexOf('<h1>Salesforce Brand</h1>') != -1, 'Could not find main Salasforce Brand tag.');
    });


  });


});