// Copyright (c) 2015-present, salesforce.com, inc. All rights reserved
// Licensed under BSD 3-Clause - see LICENSE.txt or git.io/sfdc-license

const _ = require("lodash");
const xml = require("xml");

module.exports = def => {
  const o = {
    resources: def
      .get("props")
      .map(prop => {
        const key = (() => {
          switch (prop.type) {
            case "color":
              return prop.type;
            default:
              return "property";
          }
        })();
        return {
          [key]: {
            _attr: {
              name: _.toUpper(prop.get("name")),
              category: prop.get("category"),
              value: prop.get("value")
            }
          }
        };
      })
      .toJS()
  };
  return xml(o, { indent: "  ", declaration: true });
};
