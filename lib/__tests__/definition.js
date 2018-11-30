// Copyright (c) 2015-present, salesforce.com, inc. All rights reserved
// Licensed under BSD 3-Clause - see LICENSE.txt or git.io/sfdc-license

/* eslint-env jest */

const Immutable = require("immutable-ext");
const yaml = require("js-yaml");

// eslint-disable-next-line
const logResult = r => console.log(JSON.stringify(r.toJS(), null, 2));

const { transform } = require("../definition");

const fixtureBase = Immutable.fromJS({
  global: {
    type: "test",
    category: "test"
  },
  props: {},
  aliases: {},
  imports: []
});

const getFixture = (def = "") =>
  fixtureBase
    .mergeDeep(Immutable.fromJS(yaml.safeLoad(def)))
    .update("imports", imports => imports.map(i => fixtureBase.mergeDeep(i)));

it("merges global", done => {
  transform(
    getFixture(`
      global:
        meta:
          fixture: 'a'
      props:
        TOKEN_A:
          value: 'a'
    `),
    Immutable.Map({ includeMeta: true })
  ).fold(
    e => {
      throw new Error(e);
    },
    r => {
      expect(r.getIn(["props", "TOKEN_A", "meta", "fixture"])).toEqual("a");
      done();
    }
  );
});

it("merges globals (preferring local)", done => {
  transform(
    getFixture(`
      global:
        meta:
          fixture: 'a'
      props:
        TOKEN_A:
          value: 'a'
          meta:
            fixture: 'override'
    `),
    Immutable.Map({ includeMeta: true })
  ).fold(
    e => {
      throw new Error(e);
    },
    r => {
      expect(r.getIn(["props", "TOKEN_A", "meta", "fixture"])).toEqual(
        "override"
      );
      done();
    }
  );
});

it("validates def", done => {
  const fixture = getFixture().set("props", Immutable.List());
  transform(fixture).fold(
    e => {
      expect(e).toMatch(/"props" key must be an object/);
      done();
    },
    r => {}
  );
});

it("validates props", done => {
  const fixture = getFixture(`
    props:
      TOKEN_A:
        value: 'a'
  `).deleteIn(["global", "type"]);
  transform(fixture).fold(
    e => {
      expect(e).toMatch(/Property .+? contained no "type" key/);
      done();
    },
    r => {}
  );
});

it("merges imports", done => {
  transform(
    getFixture(`
      imports:
        - global:
            meta:
              fixture: 'b'
          props:
            TOKEN_B:
              value: 'b'
      props:
        TOKEN_A:
          value: 'a'
    `),
    Immutable.Map({ includeMeta: true })
  ).fold(
    e => {
      throw new Error(e);
    },
    r => {
      expect(r.getIn(["props", "TOKEN_A", "value"])).toEqual("a");
      expect(r.getIn(["props", "TOKEN_B", "value"])).toEqual("b");
      expect(r.getIn(["props", "TOKEN_B", "meta", "fixture"])).toEqual("b");
      done();
    }
  );
});

it("overrides an imported alias if a local alias is defined with the same name", done => {
  transform(
    getFixture(`
      imports:
        - aliases:
            ALIAS_A:
              value: 'b'
      aliases:
        ALIAS_A: 'a'
      props:
        TOKEN_A:
          value: "{!ALIAS_A}"
    `)
  ).fold(
    e => {
      throw new Error(e);
    },
    r => {
      expect(r.getIn(["props", "TOKEN_A", "value"])).toEqual("a");
      done();
    }
  );
});

it("overrides an imported prop if a local prop is defined with the same name", done => {
  transform(
    getFixture(`
      imports:
        - props:
            TOKEN_A:
              value: 'b'
      props:
        TOKEN_A:
          value: 'a'
    `)
  ).fold(
    e => {
      throw new Error(e);
    },
    r => {
      expect(r.getIn(["props", "TOKEN_A", "value"])).toEqual("a");
      done();
    }
  );
});

it("overrides an imported prop with a later imported prop", done => {
  transform(
    getFixture(`
      imports:
        - props:
            TOKEN_A:
              value: 'b'
        - props:
            TOKEN_A:
              value: 'b'
    `)
  ).fold(
    e => {
      throw new Error(e);
    },
    r => {
      expect(r.getIn(["props", "TOKEN_A", "value"])).toEqual("b");
      done();
    }
  );
});

it("returns an error for circular alias references", done => {
  transform(
    getFixture(`
      aliases:
        ALIAS_A:
          value: "{!ALIAS_B}"
        ALIAS_B:
          value: "{!ALIAS_A}"
      props:
        TOKEN_A:
          value: "{!ALIAS_A}"
    `)
  ).fold(
    e => {
      expect(e.message).toMatch(/call stack/);
      done();
    },
    r => {}
  );
});

it("resolves aliases", done => {
  transform(
    getFixture(`
      aliases:
        ALIAS_A:
          value: "#FF0000"
      props:
        TOKEN_A:
          value: "{!ALIAS_A}"
    `)
  ).fold(
    e => {
      throw new Error(e);
    },
    r => {
      expect(r.getIn(["props", "TOKEN_A", "value"])).toEqual("#FF0000");
      done();
    }
  );
});

it("resolves nested aliases", done => {
  transform(
    getFixture(`
      aliases:
        ALIAS_A:
          value: "#FF0000"
        ALIAS_B:
          value: "{!ALIAS_A}"
      props:
        TOKEN_A:
          value: "{!ALIAS_A} {!ALIAS_B}"
    `)
  ).fold(
    e => {
      throw new Error(e);
    },
    r => {
      expect(r.getIn(["props", "TOKEN_A", "value"])).toEqual("#FF0000 #FF0000");
      done();
    }
  );
});

it("resolves aliases in metadata when resolveMetaAliases flag is set (true)", done => {
  transform(
    getFixture(`
      aliases:
        ALIAS_A:
          value: "#FF0000"
        ALIAS_B:
          value: "#00AAAA"
      props:
        TOKEN_A:
          value: "{!ALIAS_A}"
          meta:
            meta_test: "{!ALIAS_B}"
    `),
    Immutable.Map({ includeMeta: true, resolveMetaAliases: true })
  ).fold(
    e => {
      throw new Error(e);
    },
    r => {
      const value = r.getIn(["props", "TOKEN_A", "value"]);
      const metaValue = r.getIn(["props", "TOKEN_A", "meta", "meta_test"]);

      expect(value).toEqual("#FF0000");
      expect(metaValue).toEqual("#00AAAA");
      done();
    }
  );
});

it("DOES NOT resolve aliases in metadata when resolveMetaAliases flag is NOT set (false)", done => {
  transform(
    getFixture(`
      aliases:
        ALIAS_A:
          value: "#FF0000"
        ALIAS_B:
          value: "#00AAAA"
      props:
        TOKEN_A:
          value: "{!ALIAS_A}"
          meta:
            meta_test: "{!ALIAS_B}"
    `),
    Immutable.Map({ includeMeta: true, resolveMetaAliases: false })
  ).fold(
    e => {
      throw new Error(e);
    },
    r => {
      const value = r.getIn(["props", "TOKEN_A", "value"]);
      const metaValue = r.getIn(["props", "TOKEN_A", "meta", "meta_test"]);

      expect(value).toEqual("#FF0000");
      expect(metaValue).toEqual("{!ALIAS_B}");
      done();
    }
  );
});

it("returns an error for missing aliases values", done => {
  transform(
    getFixture(`
      props:
        TOKEN_A:
          value: "{!ALIAS_A}"
    `)
  ).fold(
    e => {
      expect(e.message).toEqual('Alias "ALIAS_A" not found');
      done();
    },
    r => {}
  );
});

it("transforms values", done => {
  const options = Immutable.fromJS({
    transforms: [
      {
        predicate: prop => true,
        transform: prop => prop.get("value").toUpperCase()
      }
    ]
  });
  transform(
    getFixture(`
      props:
        TOKEN_A:
          value: a
    `),
    options
  ).fold(
    e => {
      throw new Error(e);
    },
    r => {
      expect(r.getIn(["props", "TOKEN_A", "value"])).toEqual("A");
      done();
    }
  );
});

it("runs options.preprocess", done => {
  const options = Immutable.fromJS({
    preprocess: def => def.setIn(["global", "test"], "a")
  });
  transform(
    getFixture(`
      props:
        TOKEN_A:
          value: 'a'
    `),
    options
  ).fold(
    e => {
      throw new Error(e);
    },
    r => {
      expect(r.getIn(["props", "TOKEN_A", "test"])).toEqual("a");
      done();
    }
  );
});

it("checks options.resolveAliases", done => {
  const options = Immutable.fromJS({
    resolveAliases: false
  });
  transform(
    getFixture(`
      props:
        TOKEN_A:
          value: '{!ALIS_A}'
    `),
    options
  ).fold(
    e => {
      throw new Error(e);
    },
    r => {
      expect(r.getIn(["props", "TOKEN_A", "value"])).toEqual("{!ALIS_A}");
      done();
    }
  );
});

it("reformats simple aliases", done => {
  transform(
    getFixture(`
      aliases:
        ALIAS_A: 'red'
      props:
        TOKEN_A:
          value: '{!ALIAS_A}'
    `)
  ).fold(
    e => {
      throw new Error(e);
    },
    r => {
      expect(r.getIn(["props", "TOKEN_A", "value"])).toEqual("red");
      done();
    }
  );
});

it("reformats simple aliases (non string)", done => {
  transform(
    getFixture(`
      aliases:
        ALIAS_A: 1
      props:
        TOKEN_A:
          value: '{!ALIAS_A}'
    `)
  ).fold(
    e => {
      throw new Error(e);
    },
    r => {
      expect(r.getIn(["props", "TOKEN_A", "value"])).toEqual("1");
      done();
    }
  );
});

it("includes originalValue", done => {
  transform(
    getFixture(`
      aliases:
        ALIAS_A:
          value: 'red'
      props:
        TOKEN_A:
          value: '{!ALIAS_A}'
    `)
  ).fold(
    e => {
      throw new Error(e);
    },
    r => {
      expect(r.getIn(["props", "TOKEN_A", "originalValue"])).toEqual(
        "{!ALIAS_A}"
      );
      done();
    }
  );
});

it("excludes meta", done => {
  transform(
    getFixture(`
      props:
        TOKEN_A:
          value: 'a'
    `)
  ).fold(
    e => {
      throw new Error(e);
    },
    r => {
      expect(r.hasIn(["props", "TOKEN_A", "meta"])).toBe(false);
      done();
    }
  );
});

it("only runs value transforms once", done => {
  transform(
    getFixture(`
      imports:
        - props:
            TOKEN_B:
              value: 'b'
      props:
        TOKEN_A:
          value: 'a'
    `),
    Immutable.Map({
      transforms: Immutable.List.of(
        Immutable.Map({
          predicate: () => true,
          transform: prop => prop.get("value") + prop.get("value")
        })
      )
    })
  ).fold(
    e => {
      throw new Error(e);
    },
    r => {
      expect(r.getIn(["props", "TOKEN_B", "value"])).toBe("bb");
      done();
    }
  );
});

it("recursivley resolves aliases (Map)", done => {
  transform(
    getFixture(`
      aliases:
        red: '#FF0000'
      props:
        TOKEN_A:
          value:
            color: '{!red}'
    `)
  ).fold(
    e => {
      throw new Error(e);
    },
    r => {
      expect(r.getIn(["props", "TOKEN_A", "value", "color"])).toBe("#FF0000");
      done();
    }
  );
});

it("recursivley resolves aliases (List)", done => {
  transform(
    getFixture(`
      aliases:
        red: '#FF0000'
      props:
        TOKEN_A:
          value: [['{!red}']]
    `)
  ).fold(
    e => {
      throw new Error(e);
    },
    r => {
      expect(r.getIn(["props", "TOKEN_A", "value", 0, 0])).toBe("#FF0000");
      done();
    }
  );
});
