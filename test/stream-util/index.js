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

var path = require('path');
var gulp = require('gulp');
var through = require('through2');

var $stream = require('../../dist/stream-util');

describe('$stream', function() {

  var files;

  function collectFiles() {
    return through.obj(function(file, enc, next) {
      files.push(file);
      next();
    });
  }

  function mockPath(p) {
    return path.resolve(__dirname, 'mock', p);
  }

  function src() {
    return gulp.src(mockPath('*.json'));
  }

  beforeEach(function() {
    files = [];
  });
  
  describe('#filter()', function() {
    it('throws an error if a non functional argument is passed', function() {
      assert.throws(function() {
        $stream.filter();
      });
    });
    it('calls the filter function for each item in the stream', function(done) {
      var spy = sinon.stub().returns(true);
      src()
        .pipe($stream.filter(spy))
        .on('finish', function() {
          assert(spy.called);
          assert(spy.callCount === 2);
          done();
        });
    });
    it('filters the stream', function(done) {
      var spy = sinon.spy(function(file) {
        return file.relative === 'a.json';
      });
      src()
        .pipe($stream.filter(spy))
        .pipe(collectFiles())
        .on('finish', function() {
          assert(spy.called);
          assert(spy.callCount === 2);
          assert(files.length === 1);
          done();
        });
    });
  });

  describe('#filterPath()', function() {
    it('throws an error if a non RegExp type is passed', function() {
      assert.throws(function() {
        $stream.filterPath();
      });
    });
    it('filters the stream based on the file path', function(done) {
      src()
        .pipe($stream.filterPath(/b\.json$/))
        .pipe(collectFiles())
        .on('finish', function() {
          assert(files.length === 1);
          assert(files[0].relative === 'b.json');
          done();
        });
    });
  });

  describe('#first()', function() {
    it('throws an error if a non functional argument is passed', function() {
      assert.throws(function() {
        $stream.first('test');
      });
    });
    it('passes the first item through the stream', function(done) {
      src()
        .pipe($stream.first())
        .pipe(collectFiles())
        .on('finish', function() {
          assert(files.length === 1);
          assert(files[0].relative === 'a.json');
          done();
        });
    });
    it('passes the first item through the stream and calles the provided function', function(done) {
      var spy = sinon.spy();
      src()
        .pipe($stream.first(spy))
        .pipe(collectFiles())
        .on('finish', function() {
          assert(files.length === 1);
          assert(files[0].relative === 'a.json');
          assert(spy.called);
          done();
        });
    });
  });


  describe('#list()', function() {
    it('throws an error if the options are not an object', function() {
      assert.throws(function() {
        $stream.list('test');
      });
    });
    it('throws an error if the options are not correct', function() {
      assert.throws(function() {
        $stream.list({name:{}});
      });
      assert.throws(function() {
        $stream.list({includeExtension:'true'});
      });
    });
    it('reduces the stream to a single JSON file', function(done) {
      src()
        .pipe($stream.list())
        .pipe(collectFiles())
        .on('finish', function() {
          assert(files.length === 1);
          assert(files[0].relative === 'list.json');
          assert.doesNotThrow(function() {
            JSON.parse(files[0].contents.toString());
          });
          done();
        });
    });
    it('creates the correct JSON', function(done) {
      src()
        .pipe($stream.list())
        .pipe(collectFiles())
        .on('finish', function() {
          var json = JSON.parse(files[0].contents.toString());
          assert(typeof json.items !== 'undefined');
          assert(Array.isArray(json.items));
          assert(json.items.indexOf('a') === 0);
          assert(json.items.indexOf('b') === 1);
          done();
        });
    });
    it('names the file correctly', function(done) {
      src()
        .pipe($stream.list({ name: 'foo' }))
        .pipe(collectFiles())
        .on('finish', function() {
          assert(files[0].relative === 'foo.json');
          done();
        });
    });
    it('includes file extensions correctly', function(done) {
      src()
        .pipe($stream.list({ includeExtension: true }))
        .pipe(collectFiles())
        .on('finish', function() {
          var json = JSON.parse(files[0].contents.toString());
          assert(json.items.indexOf('a.json') === 0);
          assert(json.items.indexOf('b.json') === 1);
          done();
        });
    });
  });

  describe('#logPath()', function() {
    it('logs the full path', function(done) {
      var spy = sinon.stub(console, 'log');
      src()
        .pipe($stream.logPath())
        .on('finish', function() {
          spy.restore();
          assert(spy.callCount === 2);
          assert(spy.getCall(0).calledWith(mockPath('a.json')));
          assert(spy.getCall(1).calledWith(mockPath('b.json')));
          done();
        });
    });
    it('logs the relative path path', function(done) {
      var spy = sinon.stub(console, 'log');
      src()
        .pipe($stream.logPath(true))
        .on('finish', function() {
          spy.restore();
          assert(spy.callCount === 2);
          assert(spy.getCall(0).calledWith('a.json'));
          assert(spy.getCall(1).calledWith('b.json'));
          done();
        });
    });
  });

  describe('#spy()', function() {
    it('throws an error if a non functional argument is passed', function() {
      assert.throws(function() {
        $stream.spy();
      });
    });
    it('calls the provided function for each item in the stream', function(done) {
      var spy = sinon.spy();
      src()
        .pipe($stream.spy(spy))
        .on('finish', function() {
          assert(spy.called);
          assert(spy.callCount === 2);
          done();
        });
    });
  });

  describe('#parseJSON()', function() {
    it('converts a vinyl ".json" file to a JSON primativee', function(done) {
      var json;
      src()
        .pipe($stream.mergeJSON())
        .pipe($stream.parseJSON(function(j) {
          json = j;
        }))
        .pipe(collectFiles())
        .on('finish', function() {
          assert(files.length === 0);
          assert(typeof json !== 'undefined');
          done();
        });
    });
    it('pipes an error for non ".json" files', function(done) {
      gulp.src(mockPath('a.json'))
        .pipe(through.obj(function(file, enc, next) {
          file.path = 'foobar.txt';
          next(null, file);
        }))
        .pipe($stream.parseJSON())
        .on('error', function(err) {
          assert(err !== null);
          done();
        });
    });
    it('pipes an error if invalid JSON is encoutered', function(done) {
      gulp.src(mockPath('a.json'))
        .pipe(through.obj(function(file, enc, next) {
          file.contents = new Buffer('{"b":true,}');
          next(null, file);
        }))
        .pipe($stream.parseJSON())
        .on('error', function(err) {
          assert(err !== null);
          done();
        });
    });
  });

});
