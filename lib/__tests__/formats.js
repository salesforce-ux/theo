// Copyright (c) 2015-present, salesforce.com, inc. All rights reserved
// Licensed under BSD 3-Clause - see LICENSE.txt or git.io/sfdc-license

const path = require('path')

const theo = require('../')

const getFixture = file =>
  path.resolve(__dirname, '../__fixtures__/', file)

const format = (transform, format, fixture = 'a.json') =>
  theo
    .transform({
      type: transform,
      file: getFixture(fixture)
    })
    .chain(data =>
      theo.format({
        type: format,
        data
      })
    )
    .merge()

it('raw.json', () => {
  expect(format('raw', 'raw.json')).toMatchSnapshot()
})

it('json', () => {
  expect(format('raw', 'json')).toMatchSnapshot()
})

it('android.xml', () => {
  expect(format('android', 'android.xml')).toMatchSnapshot()
})

it('ios.json', () => {
  expect(format('ios', 'ios.json')).toMatchSnapshot()
})

it('aura.tokens', () => {
  expect(format('aura', 'aura.tokens', 'aura.json')).toMatchSnapshot()
})

it('common.js', () => {
  expect(format('web', 'common.js')).toMatchSnapshot()
})

it('html', () => {
  expect(format('web', 'html')).toMatchSnapshot()
})

it('less', () => {
  expect(format('web', 'less')).toMatchSnapshot()
})

it('list.scss', () => {
  expect(format('web', 'list.scss')).toMatchSnapshot()
})

it('map.scss', () => {
  expect(format('web', 'map.scss')).toMatchSnapshot()
})

it('map.variables.scss', () => {
  expect(format('web', 'map.variables.scss')).toMatchSnapshot()
})

it('default.sass', () => {
  expect(format('web', 'default.sass')).toMatchSnapshot()
})

it('sass', () => {
  expect(format('web', 'sass')).toMatchSnapshot()
})

it('default.scss', () => {
  expect(format('web', 'default.scss')).toMatchSnapshot()
})

it('scss', () => {
  expect(format('web', 'scss')).toMatchSnapshot()
})

it('styl', () => {
  expect(format('web', 'styl')).toMatchSnapshot()
})
