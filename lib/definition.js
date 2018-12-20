// Copyright (c) 2015-present, salesforce.com, inc. All rights reserved
// Licensed under BSD 3-Clause - see LICENSE.txt or git.io/sfdc-license

const { constant, identity } = require("core.lambda");
const Either = require("data.either");
const Immutable = require("immutable-ext");

const { ALIAS_PATTERN } = require("./constants");
const { allMatches } = require("./util");

const recursiveMap = (value, fn) => {
  if (Immutable.Map.isMap(value) || Immutable.List.isList(value)) {
    return value.map(v => recursiveMap(v, fn));
  }
  return fn(value);
};

const transform = (def, options) => {
  /**
   * Transform a definition by merging globals, resolving imports,
   * resolving aliases, etc
   */
  const go = def =>
    Either.fromNullable(def)
      .chain(validate)
      .map(options.get("preprocess", identity))
      .chain(validateProps(validateProp))
      .map(includeOriginalValue)
      .map(mergeGlobal)
      .chain(validateProps(validatePropKeys))
      .chain(transformImports)
      .map(mergeImports)
      .map(formatAliases)
      .chain(
        def =>
          options.get("resolveAliases") === false
            ? Either.of(def)
            : Either.try(resolveNestedAliases)(def)
      )
      .chain(
        def =>
          options.get("resolveAliases") === false
            ? Either.of(def)
            : Either.try(resolveAliases)(def)
      )
      .chain(
        def =>
          options.get("resolveMetaAliases") === false
            ? Either.of(def)
            : Either.try(resolveMetaAliases)(def)
      )
      .map(addPropName);
  /**
   * Merge the "global" object into each prop
   */
  const mergeGlobal = def =>
    def
      .update("props", props => props.map((v, k) => def.get("global").merge(v)))
      .delete("global");
  /**
   *
   */
  const includeOriginalValue = def =>
    def.update("props", props =>
      props.map(prop => prop.set("originalValue", prop.get("value")))
    );
  /**
   * Validate that a prop is structured correctly
   */
  const validateProp = (prop, propName) =>
    Either.of(prop).chain(
      prop =>
        Immutable.Map.isMap(prop)
          ? Either.Right(prop)
          : Either.Left(`Property "${propName}" must be an object`)
    );
  /**
   * Validate that a prop has all required keys
   */
  const validatePropKeys = (prop, propName) =>
    Immutable.List.of("value", "type", "category")
      .traverse(
        Either.of,
        propKey =>
          prop.has(propKey)
            ? Either.Right()
            : Either.Left(
                `Property "${propName}" contained no "${propKey}" key`
              )
      )
      .map(constant(prop));
  /**
   * Validate that all props have required keys
   */
  const validateProps = fn => def =>
    def
      .get("props")
      .traverse(Either.of, fn)
      .map(constant(def));
  /**
   * Validate that all props have required keys
   */
  const formatAliases = def =>
    def.update("aliases", aliases =>
      aliases.map(
        alias =>
          Immutable.Map.isMap(alias) ? alias : Immutable.Map({ value: alias })
      )
    );
  /**
   * Validate that a definition is correctly structured
   */
  const validate = def =>
    Either.of(def)
      .chain(
        def =>
          Immutable.Map.isMap(def.get("props"))
            ? Either.Right(def)
            : Either.Left('"props" key must be an object')
      )
      .chain(
        def =>
          Immutable.Map.isMap(def.get("aliases"))
            ? Either.Right(def)
            : Either.Left('"aliases" key must be an object')
      )
      .chain(
        def =>
          Immutable.Map.isMap(def.get("global"))
            ? Either.Right(def)
            : Either.Left('"global" key must be an object')
      );
  /**
   * Map each import over go()
   */
  const transformImports = def =>
    def
      .get("imports")
      .traverse(Either.of, go)
      .map(imports => def.set("imports", imports));
  /**
   * Merge aliases/props from each import into the provided def
   */
  const mergeImports = def =>
    def
      .update("aliases", aliases =>
        def
          .get("imports")
          .reduce(
            (aliases, i) =>
              aliases.merge(i.get("aliases", Immutable.OrderedMap())),
            Immutable.OrderedMap()
          )
          .merge(aliases)
      )
      .update("props", props =>
        def
          .get("imports")
          .reduce(
            (props, i) => props.merge(i.get("props", Immutable.OrderedMap())),
            Immutable.OrderedMap()
          )
          .merge(props)
      )
      .delete("imports");

  /**
   * Resolve aliases that refer to other aliases
   */
  const resolveNestedAliases = def =>
    def.update("aliases", aliases => {
      const resolve = value =>
        value.update("value", v =>
          allMatches(v, ALIAS_PATTERN).reduce(
            (v, [alias, key]) =>
              aliases.has(key)
                ? v.replace(alias, resolve(aliases.get(key)).get("value"))
                : v,
            v
          )
        );
      return aliases.map(resolve);
    });

  /**
   * Resolve aliases inside prop values
   */
  const resolveAliases = def =>
    def.update("props", props => {
      const aliases = def.get("aliases", Immutable.Map());

      return props.map((value, key) => {
        return value.update("value", v => {
          return recursiveMap(v, v => {
            if (typeof v !== "string") return v;
            return allMatches(v, ALIAS_PATTERN).reduce((v, [alias, key]) => {
              if (!aliases.has(key))
                throw new Error(`Alias "${key}" not found`);
              return v.replace(alias, aliases.getIn([key, "value"]));
            }, v);
          });
        });
      });
    });

  /**
   * Resolve aliases inside prop meta data
   */
  const resolveMetaAliases = def => {
    return def.update("props", data => {
      const aliases = def.get("aliases", Immutable.Map());

      return data.map((value, key) => {
        if (Immutable.Map.isMap(value.get("meta"))) {
          return value.update("meta", md => {
            return recursiveMap(md, md => {
              if (typeof md !== "string") return md;
              return allMatches(md, ALIAS_PATTERN).reduce(
                (md, [alias, key]) => {
                  if (!aliases.has(key))
                    throw new Error(`Alias "${key}" not found`);
                  return md.replace(alias, aliases.getIn([key, "value"]));
                },
                md
              );
            });
          });
        } else {
          return value;
        }
      });
    });
  };

  /**
   *
   */
  const transformValue = transform => prop =>
    transform.get("predicate")(prop)
      ? Either.try(transform.get("transform"))(prop).map(value =>
          prop.set("value", value)
        )
      : Either.Right(prop);
  /**
   * transform each prop value using the provided value transforms
   */
  const transformValues = def =>
    def
      .get("props")
      .keySeq()
      .toList()
      .traverse(Either.of, key => {
        const prop = def.getIn(["props", key]);
        return options
          .get("transforms", Immutable.List())
          .reduce((p, t) => p.chain(transformValue(t)), Either.of(prop));
      })
      .map(props =>
        props.reduce(
          (props, prop) => props.set(prop.get("name"), prop),
          Immutable.OrderedMap()
        )
      )
      .map(props => def.set("props", props));
  /**
   * Add a "name" key to each prop
   */
  const addPropName = def =>
    def.update("props", props =>
      props.map((prop, name) => prop.set("name", name))
    );

  const includeMeta = def =>
    def.update(
      "props",
      props =>
        options.get("includeMeta")
          ? props
          : props.map(prop => prop.delete("meta"))
    );

  return go(def)
    .map(def => def.delete("imports"))
    .chain(transformValues)
    .map(includeMeta);
};

module.exports = {
  transform: (def, options = Immutable.Map()) => transform(def, options)
};
