// Copyright (c) 2015-present, salesforce.com, inc. All rights reserved
// Licensed under BSD 3-Clause - see LICENSE.txt or git.io/sfdc-license

const Immutable = require("immutable");
const _ = require("lodash");
const { comment } = require("../util");

module.exports = def => {
  return def
    .get("props")
    .map(prop => {
      let result = Immutable.List();
      if (prop.has("comment")) {
        result = result.push(comment(prop.get("comment").trim()));
      }
      const k = _.camelCase(prop.get("name"));
      const v = JSON.stringify(prop.get("value"));
      result = result.push(`export const ${k} = ${v};`);
      return result;
    })
    .flatten(1)
    .toArray()
    .join("\n");
};
