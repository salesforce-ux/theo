// Copyright (c) 2015-present, salesforce.com, inc. All rights reserved
// Licensed under BSD 3-Clause - see LICENSE.txt or git.io/sfdc-license

const Immutable = require('immutable')
const _ = require('lodash')
const xml = require('xml')

module.exports = def => {
  const o = {
    'aura:tokens': [{
      _attr: {
        extends: def.get('auraExtends', null)
      }
    }]
    .concat(
      def.get('auraImports', Immutable.List()).map(name => {
        return {
          'aura:import': { _attr: { name } }
        }
      }).toJS()
    )
    .concat(
      def.get('props', Immutable.List()).toList().map(prop => {
        return {
          'aura:token': {
            _attr: Immutable.Map({
              name: _.camelCase(prop.get('name')),
              property: prop.get('cssProperties', Immutable.List()).join(','),
              value: prop.get('value')
            }).filter(x => x).toJS()
          }
        }
      }).toJS()
    )
  }
  return xml(o, { indent: '  ' })
}
