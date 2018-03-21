// Copyright (c) 2015-present, salesforce.com, inc. All rights reserved
// Licensed under BSD 3-Clause - see LICENSE.txt or git.io/sfdc-license

/* eslint-env jest */

const { cStyleComment, commonComment, indent } = require("../util");

const comment = `
lines
of
comments
`.slice(1);

const result = `
/*
  lines
  of
  comments
*/`.slice(1);

describe("commonComment", () => {
  it("prepends // to a single line", () => {
    const res = commonComment("One line of a comment");
    expect(res).toEqual("// One line of a comment");
  });

  it("wraps multiple lines with /* ... */", () => {
    const res = commonComment(comment.trim());
    expect(res).toEqual(result);
  });
});

describe("cStyleComment", () => {
  it("wraps single line with /* ... */", () => {
    const res = cStyleComment("One line of a comment");
    expect(res).toEqual("/* One line of a comment */");
  });

  it("wraps multiple lines with /* ... */", () => {
    const res = cStyleComment(comment.trim());
    expect(res).toEqual(result);
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
