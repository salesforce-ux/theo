# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [8.1.1]

- Added `resolveMetaAliases` option to resolve aliases in metadata. - see [#172](https://github.com/salesforce-ux/theo/issues/172)

## [8.0.1]

- Upgraded vulnerable dependency

## [8.0.0]

### ⚠️ Breaking changes

- **[android.xml]** Moves value from from attribute ([#144](https://github.com/salesforce-ux/theo/pull/144))
- **[android.xml]** Output dp values ([#156](https://github.com/salesforce-ux/theo/pull/156))
- **[android.xml]** Use the right Android XML tags ([#154](https://github.com/salesforce-ux/theo/pull/154))
- **[Android]** Convert invalid hyphens to underscores for Android ([#159](https://github.com/salesforce-ux/theo/pull/159))

## [7.0.1]

- Correctly handle number types

## [7.0.0]

- Imports are now resolved using [resolve-from](https://www.npmjs.com/package/resolve-from) [@stevenbenisek](https://github.com/stevenbenisek)
- Aliases are now recursively resolved if `value` is an object or array

### ⚠️ Breaking changes

- Due to how imports are resolved, `my-aliases` will now point to `./node_modules/my-aliases` instead of `./my-aliases`. Local imports should include the relative path (`./`, `../`)

## [6.0.0]

Theo v6 is a complete re-write that allowed us to fix some long standing issues and separate the core engine from the Gulp plugin.

- Handlebars support for `registerFormat()` ([@kaelig](https://github.com/kaelig))
- Formats can now receive additional options
- Added new formats
  - `cssmodules.css` ([@nickbalestra](https://github.com/nickbalestra))
  - `custom-properties.css`
  - `module.js`
- CLI support ([@nickbalestra](https://github.com/nickbalestra) [@tomger](https://github.com/tomger))
- Array support for "props" (as long as each prop has a "name" key) which will preserve prop order in the final output
- Bug fixes and documentation for several existing formats ([@corygibbons](https://github.com/corygibbons) [@dennisreimann ](https://github.com/dennisreimann) [@micahwood](https://github.com/micahwood) [@didoo](https://github.com/didoo))

Big thanks to [@kaelig](https://github.com/kaelig) for helping kickstart this release and to all the alpha/beta testers who reported issues and fixed bugs!

### ⚠️ Breaking changes

- Aliases are only available to files that directly import them – see [#101](https://github.com/salesforce-ux/theo/issues/101)
- The Gulp plugin is in a separate [gulp-theo](https://github.com/salesforce-ux/gulp-theo) package
- Renamed the `.meta` key to `meta`
- Removed the `includeRawValue` option in favor of always adding an `originalValue` key in each transformed prop

### Migration guide

If you would like to keep using Theo as a Gulp plugin with Theo v6,
here is what a typical update would look like:

#### <= 5.0.0

```sh
npm install theo --save-dev
```

```js
const gulp = require("gulp");
const theo = require("theo");

// Transform design/props.yml to dist/props.scss
gulp
  .src("design/props.yml")
  .pipe(theo.plugins.transform("web"))
  .pipe(theo.plugins.format("scss"))
  .pipe(gulp.dest("dist"));
```

#### >= 6.0.0

The Gulp plugin is in a separate [gulp-theo](https://github.com/salesforce-ux/gulp-theo) package:

```sh
npm install gulp-theo --save-dev
```

```js
const gulp = require("gulp");
const theo = require("gulp-theo");

// Transform design/props.yml to dist/props.scss
gulp
  .src("design/props.yml")
  .pipe(
    theo.plugin({
      transform: { type: "web" },
      format: { type: "scss" }
    })
  )
  .pipe(gulp.dest("dist"));
```

## [5.0.0]

Theo v5.0.0 comes with a ton of improvements and drops support for Node.js < 6.

A massive thanks to the contributors who made this release possible, especially to [@micahgodbolt](https://github.com/micahgodbolt).

[View all pull requests merged in v5.0.0](https://github.com/salesforce-ux/theo/pulls?utf8=%E2%9C%93&q=is%3Apr%20milestone%3Av5.0.0%20)

- Support for `*.yaml` files ([#60](https://github.com/salesforce-ux/theo/issues/60))
- Support for [JSON5](http://json5.org/) syntax (an improvement on JSON)
- Improved styleguide theme ([#56](https://github.com/salesforce-ux/theo/pull/56))
- Aliases can reference other aliases ([#69](https://github.com/salesforce-ux/theo/pull/69))
- Users may now pre-process the input with custom functions ([#71](https://github.com/salesforce-ux/theo/pull/71))
- Improved test results and moved test suite to [Jest](https://facebook.github.io/jest/)
- JavaScript is now linted using our internal standards
- Removed React from devDependencies
- Added an [EditorConfig](http://editorconfig.org/) file
- Inline comments in the output of popular formats (e.g. scss) (fixes [#58](https://github.com/salesforce-ux/theo/issues/58))
- **Breaking change:** removed the `color/hex8` transform. Instead, use `color/hex8argb` in Android, and `color/hex8rgba` in, for example, CSS level 4 values
- **Breaking change:** Node.js 6 and up is required
- Various tweaks and fixes

### ⚠️ Breaking changes

#### Dropped support for Node.js v4

Theo v5 is now compatible with Node.js v6.3 and up, dropping support for Node.js v4.

#### Error handling

Pointing to a non-existing alias now throws an error instead of failing silently.

#### Kebab case

Lodash's implementation of `kebabCase` was dropped because it separated numbers as words:

- Lodash: `A1` -> `a-1`
- Theo: `A1` -> `a1`

## 4.x.x

See <https://github.com/salesforce-ux/theo/releases>

[8.1.1]: https://github.com/salesforce-ux/theo/compare/v8.0.1...v8.1.1
[8.0.1]: https://github.com/salesforce-ux/theo/compare/v8.0.0...v8.0.1
[8.0.0]: https://github.com/salesforce-ux/theo/compare/v7.0.1...v8.0.0
[7.0.1]: https://github.com/salesforce-ux/theo/compare/v7.0.0...v7.0.1
[7.0.0]: https://github.com/salesforce-ux/theo/compare/v6.0.0...v7.0.0
[6.0.0]: https://github.com/salesforce-ux/theo/compare/v5.0.0...v6.0.0
[5.0.0]: https://github.com/salesforce-ux/theo/compare/v4.2.1...v5.0.0
