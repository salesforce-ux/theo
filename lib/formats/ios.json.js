// Copyright (c) 2015-present, salesforce.com, inc. All rights reserved
// Licensed under BSD 3-Clause - see LICENSE.txt or git.io/sfdc-license

let camelCase = require('lodash/camelCase')

module.exports = (json) => {
  let props = json.toJS().props
  let output = {
    properties: Object.keys(props).map(key => {
      let prop = props[key]
      prop.name = camelCase(prop.name)
      return prop
    })
  }
  return JSON.stringify(output, null, 2)
}
