// Copyright (c) 2015-present, salesforce.com, inc. All rights reserved
// Licensed under BSD 3-Clause - see LICENSE.txt or git.io/sfdc-license

const Immutable = require('immutable')
const _ = require('lodash')
const { pd } = require('pretty-data')

const toAttrs = attrs => attrs
  .filter(x => x)
  .map((v, k) => `${k}="${v}"`)
  .join(' ')

module.exports = def => {
  const auraImports = def.get('auraImports', Immutable.List()).map(name => {
    return `<aura:import name="${name}" />`
  }).join('\n  ')
  const props = def.get('props').map(prop => {
    const attrs = Immutable.Map({
      name: _.camelCase(prop.get('name')),
      property: prop.get('cssProperties', Immutable.List()).join(','),
      value: prop.get('value')
    })
    return `<aura:token ${toAttrs(attrs)} />`
  }).join('\n')
  const attrs = Immutable.Map({
    extends: def.get('auraExtends', null)
  })
  return pd.xml(`
    <aura:tokens ${toAttrs(attrs)}>
      ${auraImports}
      ${props}
    </aura:tokens>
  `)
}
