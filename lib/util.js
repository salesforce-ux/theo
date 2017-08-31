// Copyright (c) 2015-present, salesforce.com, inc. All rights reserved
// Licensed under BSD 3-Clause - see LICENSE.txt or git.io/sfdc-license

const Immutable = require("immutable");
const noCase = require("no-case");

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
  kebabCase
};
