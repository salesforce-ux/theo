# Release notes

<!-- Release notes authoring guidelines: http://keepachangelog.com/ -->

## [Unreleased]

Beta releases are available on npm and release notes are available here: <https://github.com/salesforce-ux/theo/releases>

- Support for `*.yaml` files ([#60](https://github.com/salesforce-ux/theo/issues/60))
- Support for [JSON5](http://json5.org/) syntax (an improvement on JSON)
- Improved styleguide theme ([#56](https://github.com/salesforce-ux/theo/pull/56))
- Aliases can reference other aliases ([#69](https://github.com/salesforce-ux/theo/pull/69))
- Users may now pre-process the input with custom functions ([#71](https://github.com/salesforce-ux/theo/pull/71))
- Improved testing results
- JavaScript is now linted using our internal standards
- Added an [EditorConfig](http://editorconfig.org/) file
- Various tweaks and fixes

### ⚠️ Breaking changes with 4.x

#### Error handling

Pointing to a non-existing alias now throws an error instead of failing silently.

#### Kebab case

Lodash's implementation of `kebabCase` was dropped because it separated numbers as words:

- Lodash: `A1` -> `a-1`
- Theo: `A1` -> `a1`

## 4.x.x

See <https://github.com/salesforce-ux/theo/releases>

[Unreleased]: https://github.com/salesforce-ux/theo/compare/v4.2.1...master
