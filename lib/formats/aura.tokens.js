// Copyright (c) 2015, salesforce.com, inc. - All rights reserved
// Licensed under BSD 3-Clause - https://opensource.org/licenses/BSD-3-Clause

const _ = require('lodash')

module.exports = json => {
  let auraImports = _.toArray(json.auraImports).map(theme => {
    return `<aura:import name="${theme}" />`
  }).join('\n  ')
  let auraExtends = typeof json.auraExtends === 'string' ? json.auraExtends : null
  let props = Object.keys(json.props).map(key => {
    const prop = json.props[key]
    let name = camelCase(prop.name)
    let cssProperties = (() => {
      if (Array.isArray(prop.cssProperties)) {
        return `property="${prop.cssProperties.join(',')}"`
      }
      return ''
    })()
    return `<aura:token name="${name}" value="${prop.value}" ${cssProperties} />`
  }).join('\n  ')
  let openTag = auraExtends
    ? `<aura:tokens extends="${auraExtends}">`
    : '<aura:tokens>'
  let xml = `
    ${openTag}
      ${auraImports}
      ${props}
    </aura:tokens>
  `
}
