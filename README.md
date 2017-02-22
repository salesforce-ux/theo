# <img src="https://raw.githubusercontent.com/salesforce-ux/theo/master/assets/theo.png" alt="Theo logo" width="28" /> Theo

[![Build Status][travis-image]][travis-url]
[![NPM version][npm-image]][npm-url]
[![Greenkeeper badge](https://badges.greenkeeper.io/salesforce-ux/theo.svg)](https://greenkeeper.io/)

Theo is a an abstraction for transforming and formatting [Design Tokens](#overview).

### Looking for the gulp plugin?

As of Theo v6, the gulp plugin is distributed as a separate package: [gulp-theo](https://www.npmjs.com/package/gulp-theo).

## Example

```yaml
# buttons.yml
props:
  buttonBackground:
    value: "{!primaryColor}"
imports:
  - aliases.yml
global:
  type: token
  category: buttons
```

```yaml
# aliases.yml
aliases:
  primaryColor:
    value: "#0070d2"
```

```js
const theo = require('theo')

theo.convert({
  transform: {
    type: 'raw',
    file: 'buttons.yml'
  },
  format: {
    type: 'raw.json'
  }
})
.then(result => {
  const rawJSON = JSON.parse(result)
  console.log(rawJSON.props.buttonBackground.value) // '#0070d2'
  console.log(rawJSON.props.buttonBackground.category) // 'buttons'
  console.log(rawJSON.props.buttonBackground.type) // 'token'
})
.catch(error => console.log(`Something went wrong: ${error}`))
```

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

*Note*: `PROP_NAME` will be set to upper case

### scss

```scss
// If prop has 'comment' key, that value will go here.
$prop-name: PROP_VALUE;
```

*Note*: `$prop-name` will be set to kebab-case.

### map.scss

```sass
$file-name-map: (
  "prop-name": (PROP_VALUE),
);
```

*Note*: `prop-name` will be set to kebab-case.

### map.variables.scss

```sass
$file-name-map-variables: (
  "prop-name": ($prop-name)
);
```

*Note*: `prop-name` will be set to kebab-case.

### sass

```sass
$prop-name: PROP_VALUE
```

*Note*: `$prop-name` will be set to kebab-case.

### less

```less
@prop-name: PROP_VALUE;
```

*Note*: `@prop-name` will be set to kebab-case.

### aura.tokens

```xml
<aura:tokens>
  <aura:token name="propName" value="PROP_VALUE" />
</aura:tokens>
```

### common.js

```js
module.exports = {
  propName: PROP_VALUE
};
```

### amd.js

```js
define(function() {
  return {
    propName: PROP_VALUE
  };
});
```

[npm-url]: https://npmjs.org/package/theo
[npm-image]: http://img.shields.io/npm/v/theo.svg

[travis-url]: https://travis-ci.org/salesforce-ux/theo
[travis-image]: http://img.shields.io/travis/salesforce-ux/theo.svg
