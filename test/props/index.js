/*
Copyright (c) 2015, salesforce.com, inc. All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
Neither the name of salesforce.com, inc. nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

var assert = require('assert');
var sinon = require('sinon');

var fs = require('fs');
var path = require('path');
var gulp = require('gulp');
var gulpu = require('gulp-util');
var through = require('through2');
var _ = require('lodash');
var xml2js = require('xml2js');

var $stream = require('../../dist/stream-util');
var $props = require('../../dist/props');

function isError(error) {
  return (error instanceof Error) || (error instanceof gulpu.PluginError);
}

describe('$props', function() {
  
  describe('#getValueTransform()', function() {
    it('throws an error if the valueTransform is not registered', function() {
      assert.throws(function() {
        $props.getValueTransform('foo');
      });
    });
    it('returns a copy of the valueTransform', function() {
      var t = $props.getValueTransform('color/rgb');
      assert(typeof t.matcher === 'function');
      assert(typeof t.transformer === 'function');
    });
  });

  describe('#valueTransformIsRegistered()', function() {
    it('returns true if the value transform is registered', function() {
      assert($props.valueTransformIsRegistered('color/rgb'));
    });
    it('returns false if the value transform isnt registered', function() {
      assert($props.valueTransformIsRegistered('color/rgb/foo') === false);
    });
  });

  describe('#registerValueTransform()', function() {
    var matcher = function() {};
    var transformer = function() {};
    it('throws an error if the name is not passed or is not a string', function() {
      assert.throws(function() {
        $props.registerValueTransform();
      });
      assert.throws(function() {
        $props.registerValueTransform(true);
      });
    });
    it('throws an error if the matcher is not passed or not a function', function() {
      assert.throws(function() {
        $props.registerValueTransform('foo');
      });
      assert.throws(function() {
        $props.registerValueTransform('foo', true);
      });
    });
    it('throws an error if the transformer is not passed or not a function', function() {
      assert.throws(function() {
        $props.registerValueTransform('foo', function() {});
      });
      assert.throws(function() {
        $props.registerValueTransform('foo', function() {}, true);
      });
    });
    it('registers the valueTransform', function() {
      $props.registerValueTransform('foo', matcher, transformer);
      var r = $props.getValueTransform('foo');
      assert(r.matcher === matcher);
      assert(r.transformer === transformer);
    });
    it('registers the valueTransform and overwrites any pre-existing valueTransforms', function() {
      var m = function() { return true; };
      var t = function(value) { return value; };
      $props.registerValueTransform('foo', m, t);
      var r = $props.getValueTransform('foo');
      assert(r.matcher !== matcher);
      assert(r.transformer !== transformer);
    });
  });

  describe('#getTransform()', function() {
    it('throws an error if the transform is not registered', function() {
      assert.throws(function() {
        $props.getTransform('foo');
      });
    });
    it('returns a copy of the transform', function() {
      var t = $props.getTransform('web');
      assert(_.includes(t, 'color/rgb'));
    });
  });

  describe('#transformIsRegistered()', function() {
    it('returns true if the value transform is registered', function() {
      assert($props.transformIsRegistered('web'));
    });
    it('returns false if the value transform isnt registered', function() {
      assert($props.transformIsRegistered('foo') === false);
    });
  });

  describe('#registerTransform()', function() {
    it('throws an error if the name is not passed or is not a string', function() {
      assert.throws(function() {
        $props.registerTransform();
      });
      assert.throws(function() {
        $props.registerTransform(true);
      });
    });
    it('throws an error if the list of valueMatchers is not passed or not an array', function() {
      assert.throws(function() {
        $props.registerTransform('foo');
      });
      assert.throws(function() {
        $props.registerTransform('foo', true);
      });
    });
    it('throws an error if any of the value transforms are not registered', function() {
      assert.throws(function() {
        $props.registerTransform('foo', ['hello']);
      });
    });
    it('registers the transform', function() {
      $props.registerTransform('foo', ['foo']);
      var r = $props.getTransform('foo');
      assert(r[0] === 'foo');
    });
    it('registers the transform and overwrites any pre-existing transforms', function() {
      $props.registerTransform('foo', ['color/rgb']);
      var r = $props.getTransform('foo');
      assert(r[0] === 'color/rgb');
    });
  });

  describe('#getFormat)', function() {
    it('throws an error if the format is not registered', function() {
      assert.throws(function() {
        $props.getFormat('foo');
      });
    });
    it('returns a copy of the format', function() {
      var f = $props.getFormat('scss');
      assert(typeof f === 'function');
    });
  });

  describe('#formatIsRegistered()', function() {
    it('returns true if the value transform is registered', function() {
      assert($props.formatIsRegistered('scss'));
    });
    it('returns false if the value transform isnt registered', function() {
      assert($props.formatIsRegistered('foo') === false);
    });
  });

  describe('#registerFormat()', function() {
    var formatter = function() {};
    it('throws an error if the name is not passed or is not a string', function() {
      assert.throws(function() {
        $props.registerFormat();
      });
      assert.throws(function() {
        $props.registerFormat(true);
      });
    });
    it('throws an error if the formatter is not passed or not an function', function() {
      assert.throws(function() {
        $props.registerFormat('foo');
      });
      assert.throws(function() {
        $props.registerFormat('foo', true);
      });
    });
    it('registers the format', function() {
      $props.registerFormat('foo', formatter);
      var f = $props.getFormat('foo');
      assert(f === formatter);
    });
  });

});

describe('$props.plugins', function() {

  describe('#legacy()', function() {
    function legacyA(done, format) {
      var src = path.resolve(__dirname, 'mock', 'legacy.json')
      gulp.src(src)
        .pipe(through.obj(function(file, enc, next) {
          var json = JSON.parse(file.contents.toString());
          file.contents = new Buffer(format(json));
          next(null, file);
        }))
        .pipe($props.plugins.legacy())
        .on('error', function(err) { done(err); })
        .on('finish', function() { done(); });
    }
    function legacyB(done) {
      var files = [];
      var src = path.resolve(__dirname, 'mock', 'legacy.json')
      gulp.src(src)
        .pipe($props.plugins.legacy())
        .pipe(through.obj(function(file, enc, next) {
          files.push(file);
          next();
        }))
        .on('finish', function() { done(files); });
    }
    function legacyC(done) {
      var files = [];
      var src = path.resolve(__dirname, 'mock', 'legacy-alt.json')
      gulp.src(src)
        .pipe($props.plugins.legacy())
        .pipe(through.obj(function(file, enc, next) {
          files.push(file);
          next();
        }))
        .on('finish', function() { done(files); });
    }
    it('pipes an error if invalid Design Properties file is encoutered', function(done) {
      legacyA(function(error) {
        assert(isError(error));
        assert(/encountered an invalid/.test(error.message));
        done();
      }, function(json) { return '{"foo":}'; });
    });
    it('pipes an error if the Design Properties file is not an object', function(done) {
      legacyA(function(error) {
        assert(isError(error));
        assert(/non object/.test(error.message));
        done();
      }, function(json) { return '[]'; });
    });
    it('pipes an error if a property with no "name" key is found', function(done) {
      legacyA(function(error) {
        assert(isError(error));
        assert(/name/.test(error.message));
        done();
      }, function(json) { json.theme.properties = [{"value":"red"}]; return JSON.stringify(json); });
    });
    it('created a single JSON file', function(done) {
      legacyB(function(files) {
        assert(files.length === 1);
        done();
      });
    });
    it('produces valid JSON', function(done) {
      legacyB(function(files) {
        assert.doesNotThrow(function() {
          JSON.parse(files[0].contents.toString());
        });
        done();
      })
    });
    it('converts legacy design properties to the new format', function(done) {
      legacyB(function(files) {
        var json = JSON.parse(files[0].contents.toString());
        assert(json.props.a.value === 'foo');
        assert(json.props.b.value === 'bar');
        assert(typeof json.theme === 'undefined');
        done();
      })
    });
    it('converts legacy aliases to the new format', function(done) {
      legacyB(function(files) {
        var json = JSON.parse(files[0].contents.toString());
        assert(!_.isArray(json.aliases));
        assert(_.has(json.aliases, 'SKY'));
        done();
      })
    });
    it('imports legacy aliases', function(done) {
      legacyC(function(files) {
        var json = JSON.parse(files[0].contents.toString());
        assert(!_.isArray(json.aliases));
        assert(_.has(json.aliases, 'SKY'));
        done();
      })
    });
    it('imports converts imports to auraImports', function(done) {
      legacyC(function(files) {
        var json = JSON.parse(files[0].contents.toString());
        assert(_.isArray(json.auraImports));
        done();
      })
    });
    it('imports converts extends to auraExtends', function(done) {
      legacyC(function(files) {
        var json = JSON.parse(files[0].contents.toString());
        assert(_.isString(json.auraExtends));
        done();
      })
    });
    it('adds a relevant type if possible', function(done) {
      legacyC(function(files) {
        var json = JSON.parse(files[0].contents.toString());
        assert(json.props.d.type === 'color');
        assert(json.props.e.type === 'size');
        done();
      })
    });
  });

  describe('#transform', function() {
    it('transforms Design Properties as JSON', function(done) {
      var error;
      gulp.src(path.resolve(__dirname, 'mock', 'sample.json'))
        .on('error', function(err) {
          error = err;
        })
        .on('finish', function() {
          assert(typeof error === 'undefined');
          done();
        })
        .pipe($props.plugins.transform('web'))
    });
    it('transforms Design Properties as YML', function(done) {
      var error;
      gulp.src(path.resolve(__dirname, 'mock', 'sample.yml'))
        .on('error', function(err) {
          error = err;
        })
        .on('finish', function() {
          assert(typeof error === 'undefined');
          done();
        })
        .pipe($props.plugins.transform('web'))
    });
  });

  describe('#format', function() {
    it('throws an error for invalid options', function() {
      assert.throws(function() {
        $props.plugins.format('web', false);
      });
    });
    it('throws an error if options.propsFilter is not a function', function() {
      try {
        $props.plugins.format('web', { propsFilter: false });
      }
      catch(e) {
        assert(typeof error === 'undefined');
        assert(/function/.test(e.message));
      }
    });
    it('formats props', function(done) {
      var error, result;
      var samplePath = path.resolve(__dirname, 'mock', 'sample.json'); 
      var postResult;
      gulp.src(samplePath)
        .on('error', function(err) {
          error = err;
        })
        .on('finish', function() {
          assert(typeof error === 'undefined');
          assert.doesNotThrow(function() {
            JSON.parse(postResult);
          });
          done();
        })
        .pipe($props.plugins.transform('web'))
        .pipe($props.plugins.format('raw.json'))
        .pipe($props.plugins.getResult(function(result) {
          postResult = result;
        }));
    });
    it('filters props before formatting', function(done) {
      var error, result;
      var samplePath = path.resolve(__dirname, 'mock', 'sample.json'); 
      //var preResult = JSON.parse(fs.readFileSync(samplePath));
      var postResult;
      gulp.src(samplePath)
        .on('finish', function() {
          assert(postResult.propKeys.length === 1);
          assert(_.keys(postResult.props).length === 1);
          done();
        })
        .pipe($props.plugins.transform('web'))
        .pipe($props.plugins.format('raw.json', { propsFilter: function(prop) { return prop.name === 'account'; } }))
        .pipe($props.plugins.getResult(function(result) {
          postResult = JSON.parse(result);
        }));
    });
    it('renames the file correctly', function(done) {
      var resultFile;
      var samplePath = path.resolve(__dirname, 'mock', 'sample.json'); 
      gulp.src(samplePath)
        .on('finish', function() {
          assert(resultFile.relative === 'sample.scss');
          done();
        })
        .pipe($props.plugins.transform('web'))
        .pipe($props.plugins.format('scss'))
        .pipe(through.obj(function(file, enc, next) {
          resultFile = file
          next(null, file);
        }))
    });
  });

  describe('#getResult', function() {
    it('gets the result of a transform', function(done) {
      var error;
      var spy = sinon.spy();
      gulp.src(path.resolve(__dirname, 'mock', 'sample.json'))
        .on('error', function(err) {
          error = err;
        })
        .on('finish', function() {
          assert(typeof error === 'undefined');
          assert(spy.calledOnce);
          assert.doesNotThrow(function() {
            JSON.parse(spy.getCall(0).args[0]);
          });
          done();
        })
        .pipe($props.plugins.transform('web'))
        .pipe($props.plugins.getResult(spy));
    });
    it('gets the result of a format', function(done) {
      var error;
      var spy = sinon.spy();
      gulp.src(path.resolve(__dirname, 'mock', 'sample.json'))
        .on('error', function(err) {
          error = err;
        })
        .on('finish', function() {
          assert(typeof error === 'undefined');
          assert(spy.calledOnce);
          assert.doesNotThrow(function() {
            JSON.parse(spy.getCall(0).args[0]);
          });
          done();
        })
        .pipe($props.plugins.transform('web'))
        .pipe($props.plugins.format('raw.json'))
        .pipe($props.plugins.getResult(spy));
    });
    it('passes the file through the stream', function(done) {
      var error;
      var spy = sinon.spy();
      var spy2 = sinon.spy();
      gulp.src(path.resolve(__dirname, 'mock', 'sample.json'))
        .on('error', function(err) {
          error = err;
        })
        .on('finish', function() {
          assert(typeof error === 'undefined');
          assert(spy.calledOnce);
          assert(spy2.calledOnce);
          done();
        })
        .pipe($props.plugins.transform('web'))
        .pipe($props.plugins.format('raw.json'))
        .pipe($props.plugins.getResult(spy))
        .pipe($props.plugins.getResult(spy2));
    });
  });

  describe('#diff()', function() {
    var files, log;
    beforeEach(function(done) {
      files = [];
      var src = [
        path.resolve(__dirname, 'mock', 'a.json'),
        path.resolve(__dirname, 'mock', 'b.json')
      ];
      gulp.src(src)
        .pipe($props.plugins.transform('ios'))
        .pipe($props.plugins.diff())
        .pipe(through.obj(function(file, enc, next) {
          files.push(file);
          next();
        }))
        .on('finish', done);
    });
    it('created a single change log', function() {
      assert(files.length === 1);
    });
    it('produces valid JSON', function() {
      assert.doesNotThrow(function() {
        JSON.parse(files[0].contents.toString());
      });
    });
    it('logs changed props', function() {
      var log = JSON.parse(files[0].contents.toString());
      assert(_.has(log, 'changed'));
      assert(_.has(log.changed, 'a'));
    });
    it('logs added props', function() {
      var log = JSON.parse(files[0].contents.toString());
      assert(_.has(log, 'added'));
      assert(_.has(log.added, 'd'));
    });
    it('logs rempved props', function() {
      var log = JSON.parse(files[0].contents.toString());
      assert(_.has(log, 'removed'));
      assert(_.has(log.removed, 'b'));
      assert(_.has(log.removed, 'c'));
    });
  });

});

describe('$props:valueTransforms', function() {
  
  describe('color/rgb', function() {
    var t = $props.getValueTransform('color/rgb').transformer;
    it('converts hex to rgb', function() {
      var p = { value: '#FF0000' };
      assert(t(p) === 'rgb(255, 0, 0)');
    });
    it('converts rgba to rgba', function() {
      var p = { value: 'rgba(255, 0, 0, 0.8)' };
      assert(t(p) === 'rgba(255, 0, 0, 0.8)');
    });
    it('converts hsla to rgba', function() {
      var p = { value: 'hsla(0, 100, 50, 0.8)' };
      assert(t(p) === 'rgba(255, 0, 0, 0.8)');
    });
  });

  describe('color/hex', function() {
    var t = $props.getValueTransform('color/hex').transformer;
    it('converts rgb to hex', function() {
      var p = { value: 'rgb(255, 0, 0)' };
      assert(t(p) === '#ff0000');
    });
    it('converts rgba to hex', function() {
      var p = { value: 'rgb(255, 0, 0, 0.8)' };
      assert(t(p) === '#ff0000');
    });
    it('converts hsla to hex', function() {
      var p = { value: 'hsla(0, 100, 50, 0.8)' };
      assert(t(p) === '#ff0000');
    });
  });

  describe('color/hex8', function() {
    var t = $props.getValueTransform('color/hex8').transformer;
    it('converts hex to hex8', function() {
      var p = { value: '#FF0000' };
      assert(t(p) === '#ffff0000');
    });
    it('converts rgba to hex8', function() {
      var p = { value: 'rgba(255, 0, 0, 0.8)' };
      assert(t(p) === '#ccff0000');
    });
    it('converts hsla to hex8', function() {
      var p = { value: 'hsla(0, 100, 50, 0.8)' };
      assert(t(p) === '#ccff0000');
    });
  });

  describe('percentage/float', function() {
    var t = $props.getValueTransform('percentage/float').transformer;
    it('converts a percentage to a float', function() {
      var p = { value: '50%' };
      assert(t(p) === '0.5');
    });
    it('converts multiple percentages to a floats', function() {
      var p = { value: 'background-size: 50% 50%' };
      assert(t(p) === 'background-size: 0.5 0.5');
    });
  });

  describe('relative/pixel', function() {
    var t = $props.getValueTransform('relative/pixel').transformer;
    it('converts em to px', function() {
      var p = { value: '1em' };
      var m = { baseFontPercentage: 100, baseFontPixel: 16 };
      assert(t(p, m) === '16px');
    });
    it('converts rem to px', function() {
      var p = { value: '1rem' };
      var m = { baseFontPercentage: 100, baseFontPixel: 16 };
      assert(t(p, m) === '16px');
    });
    it('takes the baseFontPercentage into account', function() {
      var p = { value: '1rem' };
      var m = { baseFontPercentage: 50, baseFontPixel: 16 };
      assert(t(p, m) === '8px');
    });
    it('takes the baseFontPixel into account', function() {
      var p = { value: '1rem' };
      var m = { baseFontPercentage: 100, baseFontPixel: 5 };
      assert(t(p, m) === '5px');
    });
  });

  describe('relative/pixelValue', function() {
    var t = $props.getValueTransform('relative/pixelValue').transformer;
    it('converts em to px', function() {
      var p = { value: '1em' };
      var m = { baseFontPercentage: 100, baseFontPixel: 16 };
      assert(t(p, m) === '16');
    });
    it('converts rem to px', function() {
      var p = { value: '1rem' };
      var m = { baseFontPercentage: 100, baseFontPixel: 16 };
      assert(t(p, m) === '16');
    });
    it('takes the baseFontPercentage into account', function() {
      var p = { value: '1rem' };
      var m = { baseFontPercentage: 50, baseFontPixel: 16 };
      assert(t(p, m) === '8');
    });
    it('takes the baseFontPixel into account', function() {
      var p = { value: '1rem' };
      var m = { baseFontPercentage: 100, baseFontPixel: 5 };
      assert(t(p, m) === '5');
    });
  });

});

describe('$props:formats', function() {

  var paths = {
    sample: path.resolve(__dirname, 'mock', 'sample.json'),
    sink: path.resolve(__dirname, 'mock', 'sink.json'),
    list: path.resolve(__dirname, 'mock', 'list.json')
  };

  var result;

  function $format(transform, format, src, done) {
    return function(_done) {
      gulp.src(src)
        .pipe($props.plugins.transform(transform))
        .pipe($props.plugins.format(format))
        .pipe($stream.first(function(file) {
          result = file.contents.toString();
          if (done) {
           return done(_done);
          }
          return _done();
        }));
    };
  }

  function $toJSON(done) {
    result = JSON.parse(result);
    done();
  }

  function $toXML(done) {
    xml2js.parseString(result, function(err, r) {
      result = r;
      done();
    });
  }

  describe('json', function() {
    before($format('raw', 'json', paths.sample, $toJSON));
    it('converts props to json (key/value)', function() {
      assert(_.has(result, 'account'));
    });
  });

  describe('ios.json', function() {
    before($format('raw', 'ios.json', paths.sample, $toJSON));
    it('has a "properties" array', function() {
      assert(_.has(result, 'properties'));
      assert(_.isArray(result.properties));
    });
    it('properties have a "name" and "value"', function() {
      assert(_.has(result.properties[0], 'name'));
      assert(_.has(result.properties[0], 'value'));
    });
  });

  describe('android.xml', function() {
    before($format('raw', 'android.xml', paths.sample, $toXML));
    it('has a top level resources node', function() {
      assert(_.has(result, 'resources'));
    });
    it('has property nodes', function() {
      assert(_.has(result.resources, 'property'));
    });
    it('has color nodes', function() {
      assert(_.has(result.resources, 'color'));
    });
    it('resource nodes have a "name" attribute', function() {
      _.flatten(result.resources).forEach(function(n) {
        assert(_.has(n.$, 'name'));
      });
    });
    it('resource nodes have a "category" attribute', function() {
      _.flatten(result.resources).forEach(function(n) {
        assert(_.has(n.$, 'category'));
      });
    });
  });

  describe('scss', function() {
    before($format('raw', 'scss', paths.sample));
    it('creates scss syntax', function() {
      assert(result.match(/\$spacing\-none\: 0\;\n/g) !== null);
    });
  });

  describe('map.scss', function() {
    it('creates a scss map syntax', function(done) {
      gulp.src(paths.sample)
        .pipe($props.plugins.transform('raw'))
        .pipe($props.plugins.format('map.scss'))
        .pipe($stream.first(function(file) {
          var result = file.contents.toString();
          var hasName = new RegExp(_.escapeRegExp('$sample-map: ('));
          var hasProp = new RegExp(_.escapeRegExp('"spacing-none": 0,'));
          assert(hasName.test(result));
          assert(hasProp.test(result));
          done();
        }));
    });
    it('names the map if options.name was passed', function(done) {
      gulp.src(paths.sample)
        .pipe($props.plugins.transform('raw'))
        .pipe($props.plugins.format('map.scss', {name:function(basename, path) {
          return _.camelCase(basename) + 'Map';
        }}))
        .pipe($stream.first(function(file) {
          var result = file.contents.toString();
          var hasName = new RegExp(_.escapeRegExp('$sampleMap: ('));
          var hasProp = new RegExp(_.escapeRegExp('"spacing-none": 0,'));
          assert(hasName.test(result));
          assert(hasProp.test(result));
          done();
        }));
    });
  });

  describe('list.scss', function() {
    it('creates a scss list syntax', function(done) {
      gulp.src(paths.list)
        .pipe($props.plugins.transform('raw'))
        .pipe($props.plugins.format('list.scss'))
        .pipe($stream.first(function(file) {
          var result = file.contents.toString();
          var hasName = new RegExp(_.escapeRegExp('$list-list: ('));
          var hasProp = new RegExp(_.escapeRegExp('"a",'));
          assert(hasName.test(result));
          assert(hasProp.test(result));
          done();
        }));
    });
    it('names the list if options.name was passed', function(done) {
      gulp.src(paths.list)
        .pipe($props.plugins.transform('raw'))
        .pipe($props.plugins.format('list.scss', {name:function(basename, path) {
          return 'HelloList';
        }}))
        .pipe($stream.first(function(file) {
          var result = file.contents.toString();
          var hasName = new RegExp(_.escapeRegExp('$HelloList: ('));
          var hasProp = new RegExp(_.escapeRegExp('"a",'));
          assert(hasName.test(result));
          assert(hasProp.test(result));
          done();
        }));
    });
  });

  describe('sass', function() {
    before($format('raw', 'sass', paths.sample));
    it('creates sass syntax', function() {
      assert(result.match(/\$spacing\-none\: 0\n/g) !== null);
    });
  });

  describe('less', function() {
    before($format('raw', 'less', paths.sample));
    it('creates less syntax', function() {
      assert(result.match(/\@spacing\-none\: 0;\n/g) !== null);
    });
  });

  describe('styl', function() {
    before($format('raw', 'styl', paths.sample));
    it('creates stylus syntax', function() {
      assert(result.match(/spacing\-none \= 0\n/g) !== null);
    });
  });

  describe('aura.theme', function() {
    before($format('raw', 'aura.theme', paths.sample, $toXML));
    it('has a top level aura:theme node', function() {
      assert(_.has(result, 'aura:theme'));
    });
    it('adds the "extends" attribute', function() {
      assert(_.has(result['aura:theme'].$, 'extends'));
      assert(result['aura:theme'].$.extends === 'one:theme');
    });
    it('has aura:var nodes', function() {
      assert(_.has(result['aura:theme'], 'aura:var'));
    });
    it('var nodes have a "name" attribute', function() {
      result['aura:theme']['aura:var'].forEach(function(n) {
        assert(_.has(n.$, 'name'));
      });
    });
    it('valueMatchers nodes have a "category" attribute', function() {
      result['aura:theme']['aura:var'].forEach(function(n) {
        assert(_.has(n.$, 'value'));
      });
    });
    it('has aura:importTheme nodes', function() {
      assert(_.has(result['aura:theme'], 'aura:importTheme'));
    });
    it('aura:importTheme nodes have a "name" attribute', function() {
      result['aura:theme']['aura:importTheme'].forEach(function(n) {
        assert(_.has(n.$, 'name'));
      });
    });
  });

  describe('html', function() {
    before($format('raw', 'html', paths.sink));
    it('outputs html', function() {
      var re = new RegExp(_.escapeRegExp('<!doctype html>'));
      assert(re.test(result));
    });
    it('has example rows', function() {
      var re = new RegExp(_.escapeRegExp('<td class="example"'));
      assert(re.test(result));
    });
  });

  describe('common.js', function() {
    before($format('ios', 'common.js', paths.sink));
    it('outputs a common js module', function() {
      var a = new RegExp('^' + _.escapeRegExp('module.exports = {'));
      assert(a.test(result));
      var b = new RegExp(_.escapeRegExp('};') + '$');
      assert(b.test(result));
    });
    it('evaluates as JavaScript', function() {
      assert.doesNotThrow(function() {
        eval('var module = {};' + result);
      });
    });
  });

  describe('amd.js', function() {
    before($format('ios', 'amd.js', paths.sink));
    it('outputs a common js module', function() {
      var a = new RegExp('^' + _.escapeRegExp('define(function() {'));
      assert(a.test(result));
      var b = new RegExp(_.escapeRegExp('});') + '$');
      assert(b.test(result));
    });
    it('evaluates as JavaScript', function() {
      assert.doesNotThrow(function() {
        eval('var define = function(){};' + result);
      });
    });
  });

});
