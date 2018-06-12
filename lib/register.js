// Copyright (c) 2015-present, salesforce.com, inc. All rights reserved
// Licensed under BSD 3-Clause - see LICENSE.txt or git.io/sfdc-license

const Either = require("data.either");
const fs = require("fs");
const glob = require("glob");
const handlebars = require("handlebars");
const Immutable = require("immutable");
const path = require("path");

const { isString, isFunction } = require("lodash");

const { kebabCase, comment, indent } = require("./util");

// //////////////////////////////////////////////////////////////////
// Helpers
// //////////////////////////////////////////////////////////////////

require("handlebars-helpers")({
  handlebars
});

handlebars.registerHelper("kebabcase", kebabCase);
handlebars.registerHelper("comment", comment);
handlebars.registerHelper("indent", indent);

// //////////////////////////////////////////////////////////////////
// Register
// //////////////////////////////////////////////////////////////////

let VALUE_TRANSFORMS = Immutable.Map();
let TRANSFORMS = Immutable.Map();
let FORMATS = Immutable.Map();
let FORMAT_TEMPLATES = Immutable.Map();

const registerValueTransform = (name, predicate, transform) => {
  if (!isString(name)) {
    throw new Error("valueTransform name must be a string");
  }
  if (!isFunction(predicate)) {
    throw new Error("valueTransform predicate must be a function");
  }
  if (!isFunction(transform)) {
    throw new Error("valueTransform transform must be a function");
  }
  VALUE_TRANSFORMS = VALUE_TRANSFORMS.set(
    name,
    Immutable.fromJS({
      predicate,
      transform
    })
  );
};

const registerTransform = (name, valueTransforms) => {
  if (!isString(name)) {
    throw new Error("transform name must be a string");
  }
  if (!Array.isArray(valueTransforms)) {
    throw new Error(
      "valueTransforms must be an array of registered value transforms"
    );
  }
  valueTransforms.forEach(t => {
    if (!VALUE_TRANSFORMS.has(t)) {
      throw new Error(
        "valueTransforms must be an array of registered value transforms"
      );
    }
  });
  TRANSFORMS = TRANSFORMS.set(
    name,
    Immutable.List(valueTransforms).map(valueTransform =>
      VALUE_TRANSFORMS.get(valueTransform)
    )
  );
};

const registerFormat = (name, formatter) => {
  if (!isString(name)) {
    throw new Error("format name must be a string");
  }
  if (isString(formatter)) {
    FORMAT_TEMPLATES = FORMAT_TEMPLATES.set(
      name,
      handlebars.compile(formatter)
    );
    FORMATS = FORMATS.set(name, json =>
      FORMAT_TEMPLATES.get(name)(json.toJS())
    );
    return;
  }
  if (isFunction(formatter)) {
    FORMATS = FORMATS.set(name, formatter);
    return;
  }
  throw new Error("format formatter must be a string or function");
};

// //////////////////////////////////////////////////////////////////
// Register
// //////////////////////////////////////////////////////////////////

// Value Transforms

glob.sync(path.resolve(__dirname, "transforms", "**/*.js")).forEach(file => {
  const transforms = require(file);
  Object.keys(transforms).forEach(name => {
    const t = transforms[name];
    registerValueTransform(name, t.predicate, t.transform);
  });
});

// Transforms

registerTransform("raw", []);

registerTransform("web", ["color/rgb"]);

registerTransform("ios", [
  "color/rgb",
  "relative/pixelValue",
  "percentage/float"
]);

registerTransform("android", [
  "color/hex8argb",
  "relative/pixelValue",
  "absolute/dp",
  "percentage/float"
]);

registerTransform("aura", ["color/hex"]);

// Formats

glob.sync(path.resolve(__dirname, "formats", "**/*.{js,hbs}")).forEach(file => {
  const ext = path.extname(file);
  const name = path.basename(file, ext);
  switch (ext) {
    case ".js":
      registerFormat(name, require(file));
      break;
    case ".hbs":
      registerFormat(name, fs.readFileSync(file, "utf8"));
      break;
    default:
      throw new Error(`Unrecognized format "${name}${ext}"`);
  }
});

module.exports = {
  registerValueTransform,
  registerTransform,
  registerFormat,
  getValueTransform: name => Either.fromNullable(VALUE_TRANSFORMS.get(name)),
  getTransform: name =>
    Either.fromNullable(TRANSFORMS.get(name)).leftMap(
      () => `Transform "${name}" is not registered`
    ),
  getFormat: name =>
    Either.fromNullable(FORMATS.get(name)).leftMap(
      () => `Format "${name}" is not registered`
    )
};
