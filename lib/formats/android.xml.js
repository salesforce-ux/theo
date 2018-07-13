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
          switch (prop.get("type")) {
            case "color":
              return "color";
            case "size":
              return "dimen";
            case "number":
              return "integer";
            case "string":
              return "string";
            default:
              return "property";
          }
        })();

        return {
          [key]: [
            {
              _attr: {
                name: _.toUpper(prop.get("name")).replace(/[-]/g, "_"),
                category: prop.get("category")
              }
            },
            prop.get("value")
          ]
        };
      })
      .toJS()
  };
  return xml(o, {
    indent: "  ",
    declaration: true
  });
};
