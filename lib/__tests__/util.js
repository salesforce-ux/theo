// Copyright (c) 2015-present, salesforce.com, inc. All rights reserved
// Licensed under BSD 3-Clause - see LICENSE.txt or git.io/sfdc-license

/* eslint-env jest */

const { comment, indent } = require("../util");

const input = `
lines
of
comments
`
  .slice(1)
  .trim();

const output = `
/*
  lines
  of
  comments
*/`.slice(1);

describe("comment", () => {
  it("wraps single line with /* ... */", () => {
    const res = comment("One line of a comment");
    expect(res).toEqual("/* One line of a comment */");
  });

  it("wraps multiple lines with /* ... */", () => {
    const res = comment(input);
    expect(res).toEqual(output);
  });
});

describe("indent", () => {
  it("default indentation level", () => {
    expect(indent("a\nb")).toEqual("  a\n  b");
  });

  it("custom indentation level", () => {
    expect(indent("a\nb", 1)).toEqual(" a\n b");
  });
});
