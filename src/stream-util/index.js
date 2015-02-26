/*
Copyright (c) 2015, salesforce.com, inc. All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
Neither the name of salesforce.com, inc. nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

let path    = require('path');
let _       = require('lodash');
let through = require('through2');
let gulpu   = require('gulp-util');

module.exports = {

  /**
   * Filter a stream with files that that pass the filter test
   *
   * @param {function} fn
   * @return {stream}
   */
  filter(fn) {
    if (typeof fn !== 'function') {
      throw new Error('filter() requires a functional argument');
    }
    return through.obj(function(file, enc, next) {
      if (fn(file) === true) {
        this.push(file);
      }
      next();
    });
  },

  /**
   * Filter a stream by files that match the provided regular expression
   *
   * @param {regexp} re
   * @return {stream}
   */
  filterPath(re) {
    if (!(re instanceof RegExp)) {
      throw new Error('filterPath() requires a RegExp argument');
    }
    return this.filter(file => {
      return file.path && re.test(file.path);
    });
  },

  /**
   * Pass the first item in the stream through and optionally pass a callback
   * to be called with the first item
   *
   * @param {function} [fn] - An optional function to be called on the first item
   * @return {stream}
   */
  first(fn) {
    let first = false;
    if (typeof fn !== 'undefined' && typeof fn !== 'function') {
      throw new Error('first() needs a functional argument');
    }
    return through.obj((file, enc, next) => {
      if (!first) { 
        if (fn) { fn(file); }
        first = true;
        next(null, file);
      } else {
        next();
      }
    });
  },

  /**
   * Transform a stream of files into a single JSON file with the filenames as an array
   *
   * @param {object} options
   * @param {string} options.name - The name of the file
   * @param {boolean} options.includeExtensions - Indicates if the file extensions should be included as part of the name for each item
   * @return {stream}
   */
  list(options={}) {
    let defaults = {
      name: 'list',
      includeExtension: false
    };
    if (typeof options !== 'undefined' && typeof options !== 'object') {
      throw new Error('list() options must be an object');
    }
    options = _.merge({}, defaults, options);
    if (typeof options.name !== 'string') {
      throw new Error('list() options.name must be a string');
    }
    if (typeof options.includeExtension !== 'boolean') {
      throw new Error('list() options.includeExtension must be a boolean');
    }
    let json = {
      items: []
    };
    function transform(file, enc, next) {
      let ext = path.extname(file.relative);
      let name = options.includeExtension !== true ? file.relative.replace(ext, '') : file.relative;
      json.items.push(name);
      next(null, null);
    }
    function flush(next) {
      let file = new gulpu.File({
        path: `${options.name}.json`,
        contents: new Buffer(JSON.stringify(json, null, 2))
      });
      this.push(file);
      next();
    }
    return through.obj(transform, flush);
  },

  /**
   * Log the path of each file in the stream
   *
   * @param {boolean} [isRelative] - just log the filename
   * @return {stream}
   */
  logPath(isRelative) {
    return this.spy(file => {
      console.log(isRelative ? file.relative : file.path);
    });
  },

  /**
   * Merge a stream of JSON files
   *
   * @param {object} options
   * @return {stream}
   */
  mergeJSON(options={}) {
    let defaults = {
      name: 'merge'
    };
    if (typeof options !== 'undefined' && typeof options !== 'object') {
      throw new Error('mergeJSON() options must be an object');
    }
    options = _.merge({}, defaults, options);
    if (typeof options.name !== 'string') {
      throw new Error('mergeJSON() options.name must be a string');
    }
    let items = [{}];
    function transform(file, enc, next) {
      let ext = path.extname(file.relative);
      if (ext === '.json') {
        try {
          let json = JSON.parse(file.contents.toString());
          items.push(json);
        } catch(e) {
          let err = new Error('mergeJSON() encountered an invalid JSON file', file.path);
          return next(err);
        }
      }
      next();
    }
    function flush(next) {
      let content = _.merge.apply(null, items); 
      let file = new gulpu.File({
        path: `${options.name}.json`,
        contents: new Buffer(JSON.stringify(content, null, 2))
      });
      this.push(file);
      next();
    }
    return through.obj(transform, flush);
  },

  /**
   * Call the provided function for each item in the stream
   *
   * @param {function} fn
   * @return {stream}
   */
  spy(fn) {
    if (typeof fn !== 'function') {
      throw new Error('spy() requires a functional argument');
    }
    return through.obj((file, enc, next) => {
      fn(file);
      next(null, file);
    });
  },

  /**
   * Convert the vinyl '.json' file to a JSON primative
   *
   * @param {function} [callback]
   */
  parseJSON(callback) {
    return through.obj((file, enc, next) => {
      let ext = path.extname(file.path);
      if (ext !== '.json') {
        return next(new Error('parseJSON() encountered on non ".json" file'));
      }
      try {
        let json = JSON.parse(file.contents.toString());
        if (typeof callback === 'function') {
          callback(json);          
        }
        return next(null, null);
      }
      catch(e) {
        let err = new Error('parseJSON() encountered an invalid JSON file', file.path);
        return next(err);
      }
    });
  }

};