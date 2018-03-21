// Copyright (c) 2015-present, salesforce.com, inc. All rights reserved
// Licensed under BSD 3-Clause - see LICENSE.txt or git.io/sfdc-license

const Immutable = require("immutable-ext");
const noCase = require("no-case");

const splitLines = string => string.split(/\r\n|[\r\n\u2028\u2029]/g);

const lineComment = string => `// ${splitLines(string).join(`\n// `)}`;

const indent = (string, size = 2) => {
  const pad = " ".repeat(size);
  return `${pad}${splitLines(string).join(`\n${pad}`)}`;
};

const cStyleComment = string => {
  const lineCount = splitLines(string).length;
  let comment;
  if (lineCount > 1) {
    comment = `/*\n${indent(string)}\n*/`;
  } else {
    comment = `/* ${string.trim()} */`;
  }
  return comment;
};

const commonComment = string => {
  const lineCount = splitLines(string).length;
  const commented =
    lineCount === 1 ? lineComment(string.trim()) : cStyleComment(string, 0);
  return commented;
};

const allMatches = (s, pattern) => {
  let matches = Immutable.List();
  let match;
  while ((match = pattern.exec(s)) !== null) {
    matches = matches.push(match);
  }
  return matches;
};

const isRelativeSpacing = value => /rem$/.test(value);

const remToPx = (rem, baseFontPercentage, baseFontPixel) =>
  parseFloat(rem.replace(/rem/g, "")) *
    baseFontPixel *
    (baseFontPercentage / 100) +
  "px";

const kebabCase = string => noCase(string, null, "-");

module.exports = {
  allMatches,
  isRelativeSpacing,
  remToPx,
  kebabCase,
  indent,
  commonComment,
  cStyleComment
};
