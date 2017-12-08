// Copyright (c) 2015-present, salesforce.com, inc. All rights reserved
// Licensed under BSD 3-Clause - see LICENSE.txt or git.io/sfdc-license

const Immutable = require("immutable-ext");
const _ = require("lodash");
const xml = require("xml");

module.exports = def => {
  const o = {
    "aura:tokens": [
      {
        _attr: Immutable.Map({
          extends: def.get("auraExtends")
        })
          .filter(attr => typeof attr !== "undefined")
          .toJS()
      }
    ]
      .concat(
        def
          .get("auraImports", Immutable.List())
          .map(name => {
            return {
              "aura:import": { _attr: { name } }
            };
          })
          .toJS()
      )
      .concat(
        def
          .get("props")
          .map(prop => {
            return {
              "aura:token": {
                _attr: Immutable.Map({
                  name: _.camelCase(prop.get("name")),
                  property: prop
                    .get("cssProperties", Immutable.List())
                    .join(","),
                  value: prop.get("value")
                })
                  .update(
                    attrs =>
                      !attrs.get("property") ? attrs.delete("property") : attrs
                  )
                  .toJS()
              }
            };
          })
          .toJS()
      )
  };
  return xml(o, { indent: "  " });
};
