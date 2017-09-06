# <img src="https://raw.githubusercontent.com/salesforce-ux/theo/master/assets/theo.png" alt="Theo logo" width="28" /> Theo

[![Build Status][travis-image]][travis-url]
[![NPM version][npm-image]][npm-url]

Theo is a an abstraction for transforming and formatting [Design Tokens](#overview).

> ### Looking for the gulp plugin?
>
> As of Theo v6, the gulp plugin is distributed as a separate package: [gulp-theo](https://www.npmjs.com/package/gulp-theo).

## Example

```yaml
# buttons.yml
props:
  button_background:
    value: "{!primary_color}"
imports:
  - aliases.yml
global:
  type: color
  category: buttons
```

```yaml
# aliases.yml
aliases:
  primary_color:
    value: "#0070d2"
```

```js
const theo = require('theo')

theo.convert({
  transform: {
    type: 'web',
    file: 'buttons.yml'
  },
  format: {
    type: 'scss'
  }
})
.then(scss => {
  // $button-background: rgb(0, 112, 210);
})
.catch(error => console.log(`Something went wrong: ${error}`))
```

## Custom formats

### Using a Handlebars template

Declaring a custom format goes like this:

```js
const theo = require('theo')

theo.registerFormat('array.js', `
  // Source: {{stem meta.file}}
  module.exports = [
    {{#each props as |prop|}}
      {{#if prop.comment}}// {{{prop.comment}}}{{/if}}
      ['{{camelcase prop.name}}', '{{prop.value}}'],
    {{/each}}
  ]
`)
```

A plethora of [handlebars helpers](https://github.com/helpers/handlebars-helpers#helpers),
such as `camelcase` and `stem`, are available and will assist in formatting strings in templates.

### Using a function

You may also register a format using a function:

```js
const camelCase = require('lodash/camelCase')
const path = require('path')
const theo = require('theo')

theo.registerFormat('array.js', (result) => {
  // "result" is an Immutable.Map
  // https://facebook.github.io/immutable-js/
  return `
    module.exports = [
      // Source: ${path.basename(result.getIn(['meta', 'file']))}
      ${result.get('props').map(prop => `
        ['${camelCase(prop.get('name'))}', '${prop.get('value')}'],
      `).toJS()}
    ]
  `
})
```

## API
```js
type ConvertOptions = {
  transform: TransformOptions,
  format: FormatOptions
}

type TransformOptions = {
  // If no "type" is specified, values will not be transformed
  type?: string,
  // Path to a token file
  // or just a filename if using the "data" option
  file: string,
  // Pass in a data string instead of reading from a file
  data?: string
}

type FormatOptions = {
  type: string
}

type Prop = Immutable.Map
type Result = Immutable.Map

theo.convert(options: ConvertOptions): Promise<string>

theo.convertSync(options: ConvertOptions): string

theo.registerFormat(
  name: string,
  // Either a handlebars template string
  // or a function that returns a string
  format: string | (result: Result) => string
): void

theo.registerValueTransform(
  // Referenced in "registerTransform"
  name: string,
  // Indicate if the transform should run for the provided prop
  predicate: (prop: Prop) => boolean,
  // Return the new "value"
  transform: (prop: Prop) => any
): void

theo.registerTransform(
  name: string,
  // An array of registered value transforms
  valueTransforms: Array<string>
): void
```

## CLI

Please refer to the [documentation of the CLI](https://github.com/salesforce-ux/theo/blob/master/CLI.md)

----

## Design Tokens <a name="overview"></a>

Theo consumes **Design Token** files which are a central location to store
design related information such as colors, fonts, widths, animations, etc. These raw
values can then be transformed and formatted to meet the needs of any platform.

Let's say you have a web, native iOS, and native Android application that
would like to share information such as background colors.

The web might like to consume the colors as **hsla** values
formatted as Sass variables in an **.scss** file.

iOS might like **rgba** values formatted as **.json**.

Finally, Android might like **8 Digit Hex (AARRGGBB)** values formatted as **.xml**.

Instead of hard coding this information in each platform/format, Theo
can consume the centralized **Design Tokens** and output files for
each platform.

### Spec

A *Design Token* file is written in either
[JSON](http://json.org/) ([JSON5](http://json5.org/) supported)
or [YAML](http://yaml.org/) and should conform to the following spec:

```json5
{
  // Required
  // A map of property names and value objects
  "props": {
    "color_brand": {
      // Required
      // Can be any valid JSON value
      "value": "#ff0000",

      // Required
      // Describe the type of value
      // [color|number|...]
      "type": "color",

      // Required
      // Describe the category of this property
      // Often used for style guide generation
      "category": "background",

      // Optional
      // This value will be included during transform
      // but excluded during formatting
      "meta": {
        // This value might be needed for some special transform
        "foo": "bar"
      }
    }
  },

  // Optional
  // This object will be merged into each property
  // Values defined on a property level will take precedence
  "global": {
    "category": "some-category",
    "meta": {
      "foo": "baz"
    }
  },

  // Optional
  // Share values across multiple props
  // Aliases are resolved like: {!sky}
  "aliases": {
    "sky": "blue",
    "grass": {
      "value": "green",
      "yourMetadata": "How grass looks"
    }
  },

  // Optional
  // Array of design token files to be imported
  // "aliases" will be imported as well
  // "aliases" will already be resolved
  // "global" will already be merged into each prop
  "imports": [
    "./some/dir/file.json"
  ]
}
```

## Available Formats

### custom-properties.css

```css
:root {
  /* If prop has 'comment' key, that value will go here. */
  --prop-name: PROP_VALUE;
}
```

### cssmodules.css

```css
/* If prop has 'comment' key, that value will go here. */
@value prop-name: PROP_VALUE;
```

### scss

```sass
// If prop has 'comment' key, that value will go here.
$prop-name: PROP_VALUE;
```

### sass

```sass
// If prop has 'comment' key, that value will go here.
$prop-name: PROP_VALUE
```

### less

```less
// If prop has 'comment' key, that value will go here.
@prop-name: PROP_VALUE;
```

### styl

```styl
// If prop has 'comment' key, that value will go here.
$prop-name = PROP_VALUE
```

### map.scss

```sass
$file-name-map: (
  // If prop has 'comment' key, that value will go here.
  "prop-name": (PROP_VALUE),
);
```

### map.variables.scss

```sass
$file-name-map: (
  // If prop has 'comment' key, that value will go here.
  "prop-name": ($prop-name)
);
```

### list.scss

```sass
$file-name-list: (
  // If prop has 'comment' key, that value will go here.
  "prop-name"
);
```

### module.js

```js
// If prop has 'comment' key, that value will go here.
export const propName = "PROP_VALUE";
```

### common.js

```js
module.exports = {
  // If prop has 'comment' key, that value will go here.
  propName: "PROP_VALUE"
};
```

### json

```json
{
  "PROP_NAME": "PROP_VALUE"
}
```

### raw.json

```json5
{
  "props": {
    "PROP_NAME": {
      "value": "PROP_VALUE",
      "type": "PROP_TYPE",
      "category": "PROP_CATEGORY"
    }
  }
}
```

### ios.json

```json5
{
  "properties": [
    {
      "name": "propName",
      "value": "PROP_VALUE",
      "type": "PROP_TYPE",
      "category": "PROP_CATEGORY"
    }
  ]
}
```

### android.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
  <property name="PROP_NAME" type="PROP_TYPE" category="PROP_CATEGORY">PROP_VALUE</property>
  <color name="PROP_NAME" type="color" category="PROP_CATEGORY">PROP_VALUE</color>
</resources>
```

### aura.tokens

```xml
<aura:tokens>
  <aura:token name="propName" value="PROP_VALUE" />
</aura:tokens>
```

[npm-url]: https://npmjs.org/package/theo
[npm-image]: http://img.shields.io/npm/v/theo.svg

[travis-url]: https://travis-ci.org/salesforce-ux/theo
[travis-image]: http://img.shields.io/travis/salesforce-ux/theo.svg
