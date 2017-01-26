// Copyright (c) 2015, salesforce.com, inc. - All rights reserved
// Licensed under BSD 3-Clause - https://opensource.org/licenses/BSD-3-Clause

module.exports = def =>
  JSON.stringify(
    def.delete('meta').toJS(),
    null,
    2
  )
