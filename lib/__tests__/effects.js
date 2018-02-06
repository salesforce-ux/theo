// Copyright (c) 2015-present, salesforce.com, inc. All rights reserved
// Licensed under BSD 3-Clause - see LICENSE.txt or git.io/sfdc-license

/* eslint-env jest */

const fs = require("fs");
const Immutable = require("immutable-ext");
const path = require("path");

const effects = require("../effects");

const getFixture = file => path.resolve(__dirname, "../__fixtures__/", file);

describe("load", () => {
  it("returns the file and data", done => {
    effects.load(getFixture("a.json")).fold(
      e => {
        throw new Error(e);
      },
      r => {
        expect(r.file).toEqual(getFixture("a.json"));
        expect(r.data).toEqual(fs.readFileSync(getFixture("a.json"), "utf8"));
        done();
      }
    );
  });
});

describe("parse", () => {
  it("parses json", done => {
    effects
      .load(getFixture("a.json"))
      .chain(effects.parse)
      .fold(
        e => {
          throw new Error(e);
        },
        r => {
          expect(() => {
            JSON.stringify(r);
          }).not.toThrow();
          expect(r.imports[0]).toEqual("./b.json");
          done();
        }
      );
  });
});

describe("resolve", () => {
  it("resolves and parses relative file imports", done => {
    effects
      .load(getFixture("a.json"))
      .chain(effects.resolve)
      .fold(
        e => {
          throw new Error(e);
        },
        r => {
          expect(Immutable.Map.isMap(r));
          expect(Immutable.Map.isMap(r.getIn(["imports", 0])));
          done();
        }
      );
  });
  it("resolves and parses module imports", done => {
    effects
      .load(getFixture("e.json"))
      .chain(effects.resolve)
      .fold(
        e => {
          throw new Error(e);
        },
        r => {
          expect(Immutable.Map.isMap(r));
          expect(Immutable.Map.isMap(r.getIn(["imports", 0])));
          done();
        }
      );
  });
  it("converts a props List to an OrderedMap", done => {
    effects
      .load(getFixture("c.json"))
      .chain(effects.resolve)
      .fold(
        e => {
          throw new Error(e);
        },
        r => {
          expect(Immutable.OrderedMap.isOrderedMap(r.get("props")));
          done();
        }
      );
  });
  it("throws an error when props in a List don't have a 'name' key", done => {
    effects
      .load(getFixture("d.json"))
      .chain(effects.resolve)
      .fold(
        e => {
          expect(e.message).toContain('Each prop must have a "name" key');
          done();
        },
        r => {}
      );
  });
});
