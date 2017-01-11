# <img src="https://raw.githubusercontent.com/salesforce-ux/theo/master/assets/theo.png" alt="Theo logo" width="28" /> Theo

[![Build Status][travis-image]][travis-url]
[![NPM version][npm-image]][npm-url]

Theo is a set of [Gulp](http://gulpjs.com) plugins for
transforming and formatting [Design Tokens](#overview)

## Example

```js
const gulp = require('gulp')
const theo = require('theo')

gulp.src('design/props.json')
  .pipe(theo.plugins.transform('web'))
  .pipe(theo.plugins.format('scss'))
  .pipe(gulp.dest('dist'))
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
      ".meta": {
        // This value might be needed for some special transform
        "foo": "bar"
      },

      // Optional
      // Additional keys can be included and depending on the formatter,
      // might be visible in the final output
      "some": "value"
    }
  },

  // Optional
  // This object will be merged into each property
  // Values defined on a property level will take precedence
  "global": {
    "category": "some-category",
    ".meta": {
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

## Plugins Overview

Theo is divided into two primary plugins:

### [transform](#plugins.transform)

This plugin is responsible for transforming raw values into platform specific values.

For example, the Design Tokens might specify a color value as an
rgba (`rgba(255, 0, 0, 1)`), but an Android app
might prefer to consume colors as an 8 digit hex (`#ffff0000`)

### [format](#plugins.format)

This plugin is responsible for taking transformed tokens and outputting them
into a new file format.

An Android app might prefer to consume the final values as XML:

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
  <color name="colorBrand" type="color">#ffbada55</color>
</resources>
```

## API

#### `theo.plugins.file(filePath)` <a name="plugins.file"></a>

Push a new file into a transform stream and return the stream.
This is an alternative to using gulp.

**`@param {string} filePath`**  
The name of the registered transform

#### Example:

```js
const propsFile = path.resolve(__dirname, 'design/props.json')
theo.plugins
  .file(propsFile)
  .pipe(theo.plugins.transform('web'))
```

***

#### `theo.plugins.transform(type, [options])` <a name="plugins.transform"></a>

Transform the values for each *Design Token* file according to
the specified type.

A transform is list of [valueTransforms](#registerValueTransform) that should be applied
to each property.

**`@param {string} type`**  
The name of the registered transform

**`@param {object} [options]`**  
Additional options (see below)

**`@param {boolean} [options.includeRawValue]`**  
Include raw value in prop object as `prop['.rawValue']`

**`@param {boolean} [options.resolveAliases]`**  

**`@param {boolean} [options.includeMeta]`**  
Don't remove ".meta" key from a prop

**`@param {function} [options.jsonPreProcess]`**  
A function that is ran before each YAML/JSON file is merged. Should return an object representing the modified JSON data.

#### Example:

```js
gulp.src('./design/props.json')
  .pipe(theo.plugins.transform('web', {
    includeRawValue: true,
    jsonPreProcess: json => {
      json.global.category = 'someCategory'
      return json
    }
  }))
```

***

#### `theo.registerTransform(type, valueTransforms)`

Register a new transform. Existing transforms with the same name
will be overwritten.

**`@param {string} type`**  
The name of the transform

**`@param {array} valueTransforms`**  
An array of registered value transforms

#### Example:

```js
theo.registerTransform('windows', [
  'color/rgb'
])
```

#### Pre-defined Transforms:

Below is a list of pre-defined transforms and the corresponding
[valueTransforms](registerValueTransform) that will be applied.

*Note*: Generally speaking, the pre-defined transforms assume the original
*Design Tokens* are formatted for the web.

**raw**:  
No valueTransforms will be applied

**web**:  
`['color/rgb']`

**ios**:  
`['color/rgb', 'relative/pixelValue', 'percentage/float']`

**android**:  
`['color/hex8argb', 'relative/pixelValue', 'percentage/float']`

**aura**:  
`['color/hex']`

***

#### `theo.registerValueTransform(name, matcher, transformer)` <a name="registerValueTransform"></a>

Register a new valueTransform. Existing valueTransforms with the same name
will be overwritten.

**`@param {string} type`**  
The name of the valueTransform

**`@param {function} matcher`**  
An function that should return a boolean indicating if the provided property
should be transformed

**`@param {function} transformer`**  
An function that should return a new value for the provided property

#### Example:

```js
theo.registerValueTransform('animation/web/curve',
  // Only run the transform for props that pass the matcher
  (prop, meta) => prop.type === 'animation-curve',
  // Return the transformed value
  (prop, meta) => {
    const [a, b, c, d] = prop.value
    return `cubic-bezier(${a}, ${b}, ${c}, ${d})`
  }
)
```

#### Pre-defined ValueTransforms:

**color/rgb**  
Parse the value as a color and return an rgb(a) string

**color/hex**  
Parse the value as a color and return an 6 digit hex string

**color/hex8 (⚠  Removed in v5)**  
Replaced with color/hex8argb and color/hex8rgba (see below).

**color/hex8rgba**  
Parse the value as a color and return an 8 digit hex string in the form `RRGGBBAA` (as defined by the [CSS Color specification](https://drafts.csswg.org/css-color-4/#hex-notation)).

**color/hex8argb**  
Parse the value as a color and return an 8 digit hex string in the form `AARRGGBB` (as used for [colors in Android](https://developer.android.com/reference/android/graphics/Color.html)).

**percentage/float**  
Parse a string percentage value and return a float representation

**relative/pixel**  
Parse a relative size value (em/rem) and return a pixel representation.
By default, the `baseFontSize` is set to 16 and
the `baseFontPercentage` is set to 1. These values can be overwritten in a property's
`.meta` object.

**relative/pixelValue**  
Same as *relative/pixel*, but removes the `px` extension

***

#### `theo.plugins.format(type, [options])` <a name="plugins.format"></a>

Format the output for each *Design Token* file according to
the specified type.

*Note*: This plugin will almost always run after a `transform` call.

**`@param {string} type`**  
The name of the registered format

**`@param {object} [options]`**  
Additional options to be passed along to the formatter

**`@param {function} [options.propsFilter]`**  
A filter function that can be used to filter down the props before formatting

**`@param {function} [options.propsMap]`**  
A map function that can be used modify the props before formatting

#### Example:

```js
gulp.src('design/props.json')
  .pipe(theo.plugins.transform('web'))
  .pipe(theo.plugins.format('scss'))
  .pipe(gulp.dest('dist'))
```

```js
// Only output props with a "color" type
gulp.src('design/props.json')
  .pipe(theo.plugins.transform('web'))
  .pipe(theo.plugins.format('scss', {
    // Only return props with the type of "color"
    propsFilter: prop => prop.type === 'color',
    // Prefix each prop name with "PREFIX_"
    propsMap: prop => {
      prop.name = `PREFIX_${prop.name}`
      return prop
    }
  }))
  .pipe(gulp.dest('dist'))
```

***

#### `theo.registerFormat(name, formatter)`

Register a new format. Existing formats with the same name
will be overwritten.

**`@param {string} type`**  
The name of the format

**`@param {function} formatter`**  
An function that should return a string representation
of the reformatted *Design Tokens*.

The formatter will be called with two arguments: `json` and `options`.

#### Example:

```js
/**
 * @param {object} json - see below
 * @param {object} options - any options that were passed via the `.format()` plugin
 * @param {string} options.name - The file name
 */
theo.registerFormat('scss', (json, options) => {
  return json.propKeys.map(key => {
    const prop = json.props[key]
    // Here is a good spot to reformat the name (camelCase, upperCase, etc)
    return `$${prop.name}: ${prop.value};`
  }).join('\n')
})
```

Here is the layout of the `json` argument

```json5
{
  // An object containing the transformed tokens
  "props": {},
  // An array of the keys for easy iteration
  "propKeys": []
}
```

#### Pre-defined Formats:

###### json

```json
{
  "PROP_NAME": "PROP_VALUE"
}
```

###### raw.json

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

###### ios.json

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

###### android.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
  <property name="PROP_NAME" type="PROP_TYPE" category="PROP_CATEGORY">PROP_VALUE</property>
  <color name="PROP_NAME" type="color" category="PROP_CATEGORY">PROP_VALUE</color>
</resources>
```

*Note*: `PROP_NAME` will be set to upper case

###### scss

```scss
$prop-name: PROP_VALUE;
```

###### map.scss

```sass
$file-name-map: (
  "prop-name": (PROP_VALUE),
);
```

###### map.variables.scss

```sass
$file-name-map-variables: (
  "prop-name": ($prop-name)
);
```

###### sass

```sass
$prop-name: PROP_VALUE
```

###### less

```less
@prop-name: PROP_VALUE;
```

###### aura.theme

```xml
<aura:theme>
  <aura:var name="propName" value="PROP_VALUE" />
</aura:theme>
```

###### aura.tokens

```xml
<aura:tokens>
  <aura:token name="propName" value="PROP_VALUE" />
</aura:tokens>
```

###### common.js

```js
module.exports = {
  propName: PROP_VALUE
};
```

###### amd.js

```js
define(function() {
  return {
    propName: PROP_VALUE
  };
});
```

###### Styleguide

See <https://salesforce-ux.github.io/design-properties>.


***

#### `theo.plugins.getResult([callback])`

Get the result of a transform/format

**`@param {function} [callback]`**  
The function to call for each result in the stream

#### Example:

```js
// Get the transformed Design Tokens
gulp.src('design/props.json')
  .pipe(theo.plugins.transform('web'))
  .pipe(theo.plugins.getResult(result => {
    const designProps = JSON.parse(result)
  }))
```

```js
// Get the formatted Design Tokens
gulp.src('design/props.json')
  .pipe(theo.plugins.transform('web'))
  .pipe(theo.plugins.format('android.xml'))
  .pipe(theo.plugins.getResult(result => {
    // result will be an XML string
  }))
  // The result can still be written to a file
  .pipe(gulp.dest('dist'))
```

[npm-url]: https://npmjs.org/package/theo
[npm-image]: http://img.shields.io/npm/v/theo.svg

[travis-url]: https://travis-ci.org/salesforce-ux/theo
[travis-image]: http://img.shields.io/travis/salesforce-ux/theo.svg

## License

Copyright (c) 2015, salesforce.com, inc. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice,
this list of conditions and the following disclaimer. Redistributions in
binary form must reproduce the above copyright notice, this list of
conditions and the following disclaimer in the documentation and/or
other materials provided with the distribution. Neither the name of
salesforce.com, inc. nor the names of its contributors may be used to
endorse or promote products derived from this software without specific
prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
"AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
