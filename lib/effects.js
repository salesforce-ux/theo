// Copyright (c) 2015-present, salesforce.com, inc. All rights reserved
// Licensed under BSD 3-Clause - see LICENSE.txt or git.io/sfdc-license

const { constant } = require("core.lambda");
const Either = require("data.either");
const fs = require("fs");
const Immutable = require("immutable-ext");
const JSON5 = require("json5");
const path = require("path");
const resolveFrom = require("resolve-from");
const yaml = require("js-yaml");

const load = file =>
  Either.try(fs.readFileSync)(file)
    .map(buffer => buffer.toString())
    .map(data => ({ file, data }));

const parse = ({ file, data }) => {
  switch (path.extname(file)) {
    case ".yaml":
    case ".yml":
      return Either.try(yaml.safeLoad)(data);
    case ".json":
    case ".json5":
      return Either.try(JSON5.parse)(data);
    default:
      return Either.Left(`Unable to parse file "${file}"`);
  }
};

const resolve = ({ file, data }) =>
  Either.fromNullable(data)
    .map(constant({ file, data }))
    .orElse(() => load(file))
    .chain(parse)
    .map(Immutable.fromJS)
    .map(parsed =>
      Immutable.fromJS({
        global: {},
        props: {},
        aliases: {},
        imports: []
      }).merge(parsed)
    )
    // If "props" is a List, foldMap it into an OrderedMap using "name" as the key
    .chain(parsed => {
      const props = parsed.get("props");
      if (Immutable.List.isList(props)) {
        return props
          .foldMap(
            prop =>
              prop.has("name")
                ? Either.Right(
                    Immutable.OrderedMap().set(prop.get("name"), prop)
                  )
                : Either.Left(
                    new Error(
                      'Each prop must have a "name" key when "props" is an array.'
                    )
                  ),
            Either.Right(Immutable.OrderedMap())
          )
          .map(props => parsed.set("props", props));
      }
      return Either.Right(parsed);
    })
    .chain(parsed =>
      parsed
        .get("imports")
        .traverse(Either.of, i =>
          Either.of(resolveFrom(path.dirname(file), i))
            .chain(load)
            .chain(resolve)
        )
        .map(parsedImports => parsed.set("imports", parsedImports))
    );

module.exports = {
  load,
  parse,
  resolve
};
