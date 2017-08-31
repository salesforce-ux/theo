// Copyright (c) 2015-present, salesforce.com, inc. All rights reserved
// Licensed under BSD 3-Clause - see LICENSE.txt or git.io/sfdc-license

/* eslint-env jest */

const path = require("path");

const theo = require("../");

const getFixture = file => path.resolve(__dirname, "../__fixtures__/", file);

it("transform", done => {
  theo
    .transform({
      file: getFixture("a.json")
    })
    .fold(
      e => {
        throw new Error(e);
      },
      r => {
        expect(r.delete("meta")).toMatchSnapshot();
        done();
      }
    );
});

it("format", done => {
  theo
    .transform({
      file: getFixture("a.json")
    })
    .chain(data =>
      theo.format({
        type: "raw.json",
        data
      })
    )
    .fold(
      e => {
        throw new Error(e);
      },
      r => {
        expect(r).toMatchSnapshot();
        done();
      }
    );
});

it("convertSync", () => {
  const r = theo.convertSync({
    transform: {
      file: getFixture("a.json")
    },
    format: {
      type: "raw.json"
    }
  });
  expect(r).toMatchSnapshot();
});

it("convert", done => {
  theo
    .convert({
      transform: {
        file: getFixture("a.json")
      },
      format: {
        type: "raw.json"
      }
    })
    .then(r => {
      expect(r).toMatchSnapshot();
      done();
    });
});
