// Copyright (c) 2015-present, salesforce.com, inc. All rights reserved
// Licensed under BSD 3-Clause - see LICENSE.txt or git.io/sfdc-license

const Immutable = require("immutable-ext");

const toMap = list =>
  list.reduce((a, b) => a.set(b.get("name"), b), Immutable.OrderedMap());

module.exports = def =>
  JSON.stringify(
    def
      .delete("meta")
      .update("props", toMap)
      .toJS(),
    null,
    2
  );
