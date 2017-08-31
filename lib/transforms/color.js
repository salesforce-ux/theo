// Copyright (c) 2015-present, salesforce.com, inc. All rights reserved
// Licensed under BSD 3-Clause - see LICENSE.txt or git.io/sfdc-license

const tinycolor = require("tinycolor2");

const isType = type => prop => prop.get("type") === type;

const toColor = prop => tinycolor(prop.get("value"));

module.exports = {
  "color/rgb": {
    predicate: isType("color"),
    transform: prop => toColor(prop).toRgbString()
  },
  "color/hex": {
    predicate: isType("color"),
    transform: prop => toColor(prop).toHexString()
  },
  // RRGGBBAA Hex8 notation
  // As defined in the CSS spec:
  // https://drafts.csswg.org/css-color-4/#hex-notation
  "color/hex8rgba": {
    predicate: isType("color"),
    transform: prop => toColor(prop).toHex8String()
  },
  // AARRGGBB Hex8 notation
  // Useful for Android development:
  // https://developer.android.com/reference/android/graphics/Color.html
  "color/hex8argb": {
    predicate: isType("color"),
    transform: prop =>
      toColor(prop)
        .toHex8String()
        .replace(/^#(.{6})(.{2})/, "#$2$1")
  }
};
