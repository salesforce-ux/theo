# Release notes

<!-- Release notes authoring guidelines: http://keepachangelog.com/ -->

<!-- ## [Unreleased] -->

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

### ⚠️ Breaking changes with 4.x

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

[Unreleased]: https://github.com/salesforce-ux/theo/compare/v5.0.0...master
[5.0.0]: https://github.com/salesforce-ux/theo/compare/v4.2.1...v5.0.0
