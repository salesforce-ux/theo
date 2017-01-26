// Copyright (c) 2015, salesforce.com, inc. - All rights reserved
// Licensed under BSD 3-Clause - https://opensource.org/licenses/BSD-3-Clause

const { constant } = require('core.lambda')
const Either = require('data.either')
const Immutable = require('immutable')

const {
  isFunction,
  isString
} = require('lodash')

const effects = require('./effects')
const definition = require('./definition')

const {
  registerValueTransform,
  registerTransform,
  registerFormat,
  getTransform,
  getFormat
} = require('./register')

// (...Function) -> Map -> Either Err Map
const validate = (...validators) => options =>
  Immutable.List(validators)
    .traverse(Either.of, fn => fn(options))
    .map(constant(options))

// (Function, String, String, Bool) -> Map -> Either Err Map
const v = (predicate, key, message, required = true) => options =>
  !required && !options.has(key)
    ? Either.Right(options)
    : predicate(options.get(key))
      ? Either.Right(options)
      : Either.Left(`Invalid option "${key}": ${message}`)

// Map -> Either Err Map
const validateTransform = options =>
  Either
    .fromNullable(options)
    .leftMap(() => `No options?`)
    .map(Immutable.fromJS)
    .chain(validate(
      v(isString, 'file', 'must be a path'),
      v(isString, 'data', 'must be a string', false)
    ))
    .chain(options =>
      getTransform(options.get('type'))
        .map(transforms =>
          options.set('transforms', transforms)
        )
    )

// Map -> Either Err Map
const transform = options => validateTransform(options)
  .chain(options =>
    effects.resolve({
      file: options.get('file'),
      data: options.get('data')
    })
    .chain(parsed =>
      definition
        .transform(parsed, options)
        .map(def =>
          def.set('meta', Immutable.Map({
            file: options.get('file')
          }))
        )
    )
  )

// Map -> Either Err Map
const validateFormat = options =>
  Either
    .fromNullable(options)
    .leftMap(() => `No options?`)
    .map(Immutable.fromJS)
    .map(options =>
      Immutable.Map({
        propsFilter: () => true,
        propsMap: prop => prop
      }).merge(options)
    )
    .chain(validate(
      v(Immutable.Map.isMap, 'data', 'must be an Immutable.Map'),
      v(isFunction, 'propsFilter', 'must be a function'),
      v(isFunction, 'propsMap', 'must be a function')
    ))
    .chain(options =>
      getFormat(options.get('type'))
        .map(format =>
          options.set('format', format)
        )
    )

// Map -> Either Err Map
const format = options => validateFormat(options)
  .map(options => {
    const format = options.get('format')
    const propsFilter = options.get('propsFilter')
    const propsMap = options.get('propsMap')
    const data = options
      .get('data')
      .update('props', props => props
        .filter(propsFilter)
        .map(propsMap)
      )
    return format(data)
  })

module.exports = {
  registerValueTransform,
  registerTransform,
  registerFormat,
  transform,
  format
}
