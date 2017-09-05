// Copyright (c) 2015-present, salesforce.com, inc. All rights reserved
// Licensed under BSD 3-Clause - see LICENSE.txt or git.io/sfdc-license

const camelCase = require("lodash/camelCase");

module.exports = result => {
  let output = {
    properties: result
      .get("props")
      .map(prop => {
        return prop.update("name", camelCase).delete("originalValue");
      })
      .toJS()
  };
  return JSON.stringify(output, null, 2);
};
