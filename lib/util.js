// Copyright (c) 2015-present, salesforce.com, inc. All rights reserved
// Licensed under BSD 3-Clause - see LICENSE.txt or git.io/sfdc-license

const Immutable = require("immutable-ext");
const noCase = require("no-case");

const splitLines = string => string.split(/\r\n|[\r\n\u2028\u2029]/g);

const indent = (string, size = 2) => {
  const pad = " ".repeat(size);
  return `${pad}${splitLines(string).join(`\n${pad}`)}`;
};

const comment = string => {
  const lineCount = splitLines(string).length;
  let comment;
  if (lineCount > 1) {
    comment = `/*\n${indent(string)}\n*/`;
  } else {
    comment = `/* ${string.trim()} */`;
  }
  return comment;
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
const isAbsoluteSpacing = value => /px$/.test(value);

const remToPx = (rem, baseFontPercentage, baseFontPixel) =>
  parseFloat(rem.replace(/rem/g, "")) *
    baseFontPixel *
    (baseFontPercentage / 100) +
  "px";

const pxToDp = px => px.replace(/px/g, "") + "dp";

const kebabCase = string => noCase(string, null, "-");

module.exports = {
  allMatches,
  isRelativeSpacing,
  isAbsoluteSpacing,
  remToPx,
  pxToDp,
  kebabCase,
  indent,
  comment
};
