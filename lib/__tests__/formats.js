// Copyright (c) 2015-present, salesforce.com, inc. All rights reserved
// Licensed under BSD 3-Clause - see LICENSE.txt or git.io/sfdc-license

/* eslint-env jest */

const Immutable = require("immutable-ext");
const yaml = require("js-yaml");

const { transform } = require("../definition");
const theo = require("../");

const safeLoad = y => Immutable.fromJS(yaml.safeLoad(y));

const fixtureBase = safeLoad(`
  imports: []
  meta:
    file: 'fixture'
  global:
    category: 'test'
    type: 'test'
    meta:
      baseFontPixel: 16
      baseFontPercentage: 100
  aliases: {}
  props:
    TOKEN_COLOR:
      value: '#bada55'
      category: 'background-color'
      type: 'color'
    TOKEN_SIZE:
      value: '20px'
      category: 'spacing'
      type: 'size'
    TOKEN_STRING:
      value: '/assets/images'
      type: 'string'
    TOKEN_NUMBER:
      value: 2
      type: 'number'
    TOKEN_QUOTES:
      value: "'Salesforce Sans', \\"Helvetica Neue\\", sans-serif"
      comment: "This should not get escaped in the output"
`);

const format = (type, def = ``) =>
  transform(fixtureBase.mergeDeep(safeLoad(def)))
    .chain(data =>
      theo.format({
        type,
        data
      })
    )
    .merge();

it("raw.json", () => {
  expect(format("raw.json")).toMatchSnapshot();
});

it("json", () => {
  expect(format("json")).toMatchSnapshot();
});

it("android.xml", () => {
  expect(format("android.xml")).toMatchSnapshot();
});

it("ios.json", () => {
  expect(format("ios.json")).toMatchSnapshot();
});

it("aura.tokens", () => {
  const result = format(
    "aura.tokens",
    `
    auraImports:
      - importOne
      - importTwo
    auraExtends: "theme"
    props:
      TOKEN_CSS:
        value: 'white'
        cssProperties:
          - background
          - border
  `
  );
  expect(result).toMatchSnapshot();
});

it("aura.tokens (exclude attrs)", () => {
  const result = format(
    "aura.tokens",
    `
    props:
      TOKEN_CSS:
        value: 'white'
  `
  );
  expect(result).toMatchSnapshot();
});

it("common.js", () => {
  expect(format("common.js")).toMatchSnapshot();
});

it("common.js with multiline comments", () => {
  const result = format(
    "common.js",
    `
    props:
      TOKEN_QUOTES:
        comment: |
          Multiline
          Comment`
  );
  expect(result).toMatchSnapshot();
});

it("html", () => {
  expect(format("html")).toMatchSnapshot();
});

it("less", () => {
  expect(format("less")).toMatchSnapshot();
});

it("list.scss", () => {
  expect(format("list.scss")).toMatchSnapshot();
});

it("map.scss", () => {
  expect(format("map.scss")).toMatchSnapshot();
});

it("map.variables.scss", () => {
  expect(format("map.variables.scss")).toMatchSnapshot();
});

it("default.sass", () => {
  expect(format("default.sass")).toMatchSnapshot();
});

it("sass", () => {
  expect(format("sass")).toMatchSnapshot();
});

it("default.scss", () => {
  expect(format("default.scss")).toMatchSnapshot();
});

it("scss", () => {
  expect(format("scss")).toMatchSnapshot();
});

it("styl", () => {
  expect(format("styl")).toMatchSnapshot();
});

it("cssmodules.css", () => {
  expect(format("cssmodules.css")).toMatchSnapshot();
});

it("custom-properties.css", () => {
  expect(format("custom-properties.css")).toMatchSnapshot();
});

it("module.js", () => {
  expect(format("module.js")).toMatchSnapshot();
});
