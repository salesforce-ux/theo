// Copyright (c) 2015-present, salesforce.com, inc. All rights reserved
// Licensed under BSD 3-Clause - see LICENSE.txt or git.io/sfdc-license

const { PERCENTAGE_PATTERN } = require("../constants");

module.exports = {
  "percentage/float": {
    predicate: prop => /%/.test(prop.get("value")),
    transform: prop =>
      prop
        .get("value")
        .replace(PERCENTAGE_PATTERN, (match, number) =>
          parseFloat(number / 100)
        )
  }
};
