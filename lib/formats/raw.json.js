// Copyright (c) 2015-present, salesforce.com, inc. All rights reserved
// Licensed under BSD 3-Clause - see LICENSE.txt or git.io/sfdc-license

module.exports = def =>
  JSON.stringify(
    def.delete('meta').toJS(),
    null,
    2
  )
