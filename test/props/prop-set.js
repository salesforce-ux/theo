var assert = require('assert');
var sinon = require('sinon');

var fs = require('fs');
var path = require('path');
var gulp = require('gulp');
var gulpu = require('gulp-util');
var through = require('through2');
var _ = require('lodash');

require('6to5/register')({
  only: path.resolve('./src')
});

var PropSet = require('../../src/props/prop-set');

function isError(error) {
  return (error instanceof Error) || error instanceof gulpu.PluginError;
}

describe('PropSet', function() {

  var set, file, def;
  
  beforeEach(function() {
    var p = path.resolve(__dirname, 'mock', 'c.json');
    var f = fs.readFileSync(p);
    def = JSON.parse(f);
    file = new gulpu.File({
      path: p,
      contents: new Buffer(f)
    });
    var t1 = {
      matcher: function(prop) { return prop.category === 'test-a'; },
      transformer: function(prop) { return prop.value + '__' + prop.name; }
    };
    var t2 = {
      matcher: function(prop) { return prop.category === 'test-b'; },
      transformer: function(prop) { return prop.name; }
    };
    set = new PropSet(file, [t1, t2]);
  });

  describe('#constructor', function() {
    it('throws an error if a non-vinyl file is passed', function() {
      try {
        new PropSet(new Buffer('{}'), []);
      } catch(error) {
        assert(isError(error));
        assert(/vinyl/.test(error.message));
      }
    });
    it('saves the file, path, and transforms', function() {
      var file = new gulpu.File({
        path: 'foobar.json',
        contents: new Buffer('{"props":{}}')
      });
      var valueTransforms = ['foo'];
      var set = new PropSet(file, valueTransforms);
      assert(set.file === file);
      assert(set.path === 'foobar.json');
      assert(set.valueTransforms === valueTransforms);
    });
    it('throws an error if invalid JSON is encountered', function() {
      try {
        var file = new gulpu.File({
          path: 'foobar.json',
          contents: new Buffer('{foo:')
        });
        new PropSet(file, []);
      } catch(error) {
        assert(isError(error));
        assert(/encountered an invalid/.test(error.message));
      }
    });
    it('saves the def', function() {
      assert(_.has(set, 'def'));
    });
    it('cleans up the def', function() {
      assert(!_.has(set.def, 'global'));
      assert(!_.has(set.def, 'imports'));
    });
    it('resolves imports', function() {
      ['a', 'b', 'c', 'd', 'e'].forEach(function(name) {
        assert(_.has(set.def.props, name));
      });
    });
    it('resolves imports with duplicate props', function() {
      assert(set.def.props.a.value === '2em');
    });
    it('merges globals before import', function() {
      assert(set.def.props.a.category === 'test-b');
    });
    it('resolves aliases', function() {
      assert(set.def.props.b.value === 'blue');
      assert(set.def.props.c.value === 'green');
      assert(set.def.props.f.value === 'green');
    });
  });

  describe('#_validate', function() {
    it('throws an error if no "props" key is found', function() {
      try {
        set._validate({});
      } catch(error) {
        assert(isError(error));
        assert(/contained no "props" object/.test(error.message));
      }
    });
    it('throws an error if any prop is malformed', function() {
      var keys = ['value', 'type', 'category'];
      keys.forEach(function(key) {
        try {
          var def = {props:{a:{}}};
          _.without(keys, key).forEach(function(k) {
            def.props.a[k] = 'test';
          });
          set._validate(def);
        } catch(error) {
          assert(isError(error));
          var re = new RegExp(_.escapeRegExp('contained no "'+key+'" key'));
          assert(re.test(error.message));
        }
      });
    });
  });

  describe('#_resolveGlobals', function() {
    it ('returns undefined if no keys were found in def.global', function() {
      var def = { global: {} };
      assert(set._resolveGlobals(def) === undefined);
    });
    it ('merges def.global into each def.props', function() {
      var def = { global: {foo:"bar"}, props: { a: { value:"hello" } } };
      set._resolveGlobals(def)
      assert(_.has(def.props.a, 'foo'));
      assert(def.props.a.foo === 'bar');
    });
    it ('doesn\'t overwrite existing keys', function() {
      var def = { global: {foo:"bar"}, props: { a: { foo:"baz" } } };
      set._resolveGlobals(def)
      assert(_.has(def.props.a, 'foo'));
      assert(def.props.a.foo === 'baz');
    });
    it('removes the "global" key from the def', function() {
      var def = { global: {foo:"bar"}, props: { a: { foo:"baz" } } };
      set._resolveGlobals(def)
      assert(!_.has(def, 'global'));
    });
  });

  describe('#_resolveAliases', function() {
    it ('replaces all instances of an alias in string values', function() {
      var def = {
        aliases: { sky: "blue", land: "green" },
        props: {
          a: { value: "{!sky}" },
          b: { value: "{!sky} - {!sky}" },
          c: { value: "{!sky} - {!land}" }
        }
      };
      set._resolveAliases(def);
      assert(def.props.a.value === 'blue');
      assert(def.props.b.value === 'blue - blue');
      assert(def.props.c.value === 'blue - green');
    });
  });

  describe('#_resolveImports', function() {
    it ('returns an empty array if no imports are found', function() {
      var def = { props: {} };
      var imports = set._resolveImports(def);
      assert(_.isArray(imports));
      assert(imports.length === 0);
    });
    it ('throws an error if an import is not found', function() {
      var def = { props: {}, imports: ['./foo/bar.json'] };
      assert.throws(function() {
        set._resolveImports(def);
      });
    });
    it ('returns an array of PropSets', function() {
      var imports = set._resolveImports(def);
      assert(_.isArray(imports));
      assert(imports.length === 2);
      assert(imports[0] instanceof PropSet);
      assert(/a\.json$/.test(imports[0].path));
      assert(imports[1] instanceof PropSet);
      assert(/b\.json$/.test(imports[1].path));
    });
  });

  function transformProps() {
    it('gives each prop a "name" key', function() {
      set._transformProps();
      _.forEach(set.def.props, function(prop, key) {
        assert(_.has(prop, 'name'));
        assert(prop.name === key);
      });
    });
    it('runs each prop through the matcher/transformer', function() {
      set._transformProps();
      ['b', 'c'].forEach(function(name) {
        var re = new RegExp('__' + name + '$');
        assert(re.test(set.def.props[name].value))
      });
      ['a', 'd'].forEach(function(name) {
        assert(set.def.props[name].value === name);
      });
    });
    it('deletes the ".meta" key for each prop', function() {
      set._transformProps();
      _.forEach(set.def.props, function(prop) {
        assert(!_.has(prop, '.meta'));
      });
    });
  }

  describe('#_transformProps', transformProps);

  describe('#_transformValue', function() {
    var t1, prop, meta;
    beforeEach(function() {
      t1 = {
        matcher: sinon.stub().returns(true),
        transformer: sinon.stub().returns('transform')
      };
      prop = {
        name: 'a',
        value: 'hello',
        type: 'string',
        category: 'test'
      };
      meta = {
        foo: 'bar'
      };
      set.valueTransforms = [t1];
    });
    it('calls each matcher with the cloned prop and meta', function() {
      set._transformValue(prop, meta);
      assert(t1.matcher.calledOnce);
      assert(t1.matcher.getCall(0).args[0] !== prop);
      assert(t1.matcher.getCall(0).args[1] !== meta);
    });
    it('calls each transformer with the cloned prop and meta', function() {
      set._transformValue(prop, meta);
      assert(t1.transformer.calledOnce);
      assert(t1.transformer.getCall(0).args[0] !== prop);
      assert(t1.transformer.getCall(0).args[1] !== meta);
    });
    it('only calls the transformer if the matcher returns true', function() {
      t1.matcher = sinon.stub().returns(false);
      set._transformValue(prop, meta);
      assert(t1.matcher.called);
      assert(!t1.transformer.called);
    });
  });
  
  describe('#transform', function() {
    it('transforms the props', transformProps);
    it('returns the PropSet', function() {
      var s = set.transform();
      assert(s === set);
    });
  });

  describe('#toJSON', function() {
    it('returns a string', function() {
      assert(typeof set.toJSON() === 'string');
    });
    it('returns valid JSON', function() {
      var json = set.toJSON();
      assert.doesNotThrow(function() {
        JSON.parse(json);
      });
    });
    it('removes any non essential keys', function() {
      var def = JSON.parse(set.toJSON());
      assert(!_.has(def, 'aliases'));
    });
    it('adds a "propKeys" array', function() {
      var def = JSON.parse(set.toJSON());
      assert(_.has(def, 'propKeys'));
      assert(_.isArray(def.propKeys));
      assert(def.propKeys.length === _.keys(def.props).length);
      assert(_.intersection(def.propsKeys, _.keys(def.props)).length === def.propKeys.length);
    });
  });

  describe('#toBuffer', function() {
    it('returns a Buffer', function() {
      assert(set.toBuffer() instanceof Buffer);
    });
    it('returns a Buffer with the JSON', function() {
      assert(set.toBuffer().toString() === set.toJSON());
    });
  });

});

