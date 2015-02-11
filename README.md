# <img src="https://raw.githubusercontent.com/salesforce-ux/theo/master/assets/theo.png" alt="Theo logo" width="28" /> Theo

[![build status](https://travis-ci.org/salesforce-ux/theo.svg?branch=gulp)](https://travis-ci.org/salesforce-ux/theo)
[![npm version](https://badge.fury.io/js/theo.svg)](http://badge.fury.io/js/theo)

Theo is a set of [Gulp](http://gulpjs.com) plugins for
transforming and formatting [Design Properties](#overview)

## Example

```js
var gulp = require('gulp');
var theo = require('theo');

gulp.src('design/props.json')
  .pipe(theo.plugins.transform('web'))
  .pipe(theo.plugins.format('scss'))
  .pipe(gulp.dest('dist'));
```

## Design Properties <a name="overview"></a>

Theo consumes **Design Property** files which are a central location to store
design related information such as colors, fonts, widths, animations, etc. These raw
values can then be transformed and formatted to meet the needs of any platform.

Let's say you have a web, native iOS, and native Android application that
would like to share information such as background colors.

The web might like to consume the colors as **hsla** values
formatted as SASS variables in an **.scss** file.

iOS might like **rgba** values formatted as **.json**.

Finally, Android might like **8 Digit Hex** values formatted as **.xml**.

Instead of hard coding this information in each platform/format, Theo
can consume the centralized **Design Properties** and output files for
each platform.

### Spec

A *Design Properties* file is written in either
`json` or `yml` and should conform to the following spec:

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
      // Descriibe the category of this property
      // Often used for style guide generation
      "category": "background",

      // Optional
      // This value will be included during transform
      // but excluded during formating
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
    "sky": "blue"
  },

  // Optional
  // Array of design property files to be imported
  // "aliases" will be imported as well
  // "aliases" will already be resolved
  // "global" will already be merged into into each prop
  "imports": [
    "./some/dir/file.json"
  ]
}
```

## Plugins Overview

Theo is divided into two primary plugins:

### transform

This plugin is responsible for transforming raw values into platform specific values.

For example, the Design Properties might specify a color value as an
rgba (`rgba(255, 0, 0, 1)`), but an Android app
might prefer to consume colors as an 8 digit hex (`#ffff0000`)

### format

This plugin is responsible for taking transformed properties and outputting them
into a new file format.

An Android app might prefer to consume the final values as XML:

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
  <color name="colorBrand" type="color">#ffbada55</color>
</resources>
```

## API

####`theo.plugins.transform(type)`

Transform the values for each *Design Property* file according to
the specified type.

A transform is list of [valueTransforms](#registerValueTransform) that should be applied
to each property.

**@param {string} type**  
The name of the registered transform

#### Example:

```js
gulp.src('./design/props.json')
  .pipe(theo.plugins.transform('web'));
```

***

####`theo.registerTransform(type, valueTransforms)`

Register a new transform. Existing transforms with the same name
will be overwritten.

**@param {string} type**  
The name of the transform

**@param {array} valueTransforms**  
An array of registered value transforms

#### Example:

```js
theo.registerTransform('windows', [
  'color/rgb'
]);
```

#### Pre-defined Transforms:

Below is a list of pre-defined transforms and the corresponding
[valueTransforms](registerValueTransform) that will be applied.

*Note*: Generally speaking, the pre-defined transforms assume the original
*Design Properties* are formatted for the web.

**raw**:  
No valueTransforms will be applied

**web**:  
`['color/rgb']`

**ios**:  
`['color/rgb', 'relative/pixelValue', 'percentage/float']`

**android**:  
`['color/hex8', 'relative/pixelValue', 'percentage/float']`

**aura**:  
`['color/hex']`

***

####`theo.registerValueTransform(name, matcher, transformer)` <a name="registerValueTransform"></a>

Register a new valueTransform. Existing valueTransforms with the same name
will be overwritten.

**@param {string} type**  
The name of the valueTransform

**@param {function} matcher**  
An function that should return a boolean indicating if the provided property
should be transformed

**@param {function} transformer**  
An function that should return a new value for the provided property

#### Example:

```js
theo.registerValueTransform('animation/web/curve',
  // Only run the transform for props that pass the matcher
  (prop, meta) => prop.type === 'animation-curve',
  // Return the transformed value
  (prop, meta) => {
    let [a,b,c,d] = prop.value;
    return `cubic-bezier(${a}, ${b}, ${c}, ${d})`;
  }
);
```

#### Pre-defined ValueTransforms:

**color/rgb**  
Parse the value as a color and return an rgb(a) string

**color/hex**  
Parse the value as a color and return an 6 digit hex string

**color/hex8**  
Parse the value as a color and return an 8 digit hex string

**percentage/float**  
Parse a string percentage value and return a float represention

**relative/pixel**  
Parse a relative size value (em/rem) and return a pixel representation.
By default, the `baseFontSize` is set to 16 and
the `baseFontPercentage` is set to 1. These values can be overwritten in a property's
`.meta` object.

**relative/pixelValue** 
Same as *relative/pixel*, but removes the `px` extension

***

####`theo.plugins.format(type, [options])`

Format the output for each *Design Property* file according to
the specified type.

*Note*: This plugin will almost always run after a `transform` call.

**@param {string} type**  
The name of the registered format

**@param {object} [options]**  
Additional options to be passed along to the formatter

#### Example:

```js
gulp.src('design/props.json')
  .pipe(theo.plugins.transform('web'))
  .pipe(theo.plugins.format('scss'))
  .pipe(gulp.dest('dist'));
```

***

####`theo.registerFormat(name, formatter)`

Register a new format. Existing formats with the same name
will be overwritten.

**@param {string} type**  
The name of the format

**@param {function} formatter**  
An function that should return a string representation
of the reformatted *Design Properties*.

The formatter will be called with two arguments:

**json** - an object with the following layout:

#### Example:

```js
/**
 * @param {object} json - see below
 * @param {object} options - any options that were passed via the `.format()` plugin
 * @param {string} options.name - The file name
 */
theo.registerFormat('scss', (json, options) => {
  return json.propKeys.map(key => {
    let prop = json.props[key];
    // Here is a good spot to reformat the name (camelCase, upperCase, etc)
    return `$${prop.name}: ${prop.value};`;
  }).join('\n');
});
```

Here is the layout of the `json` argument
```json5
{
  // An object containing the transformed properties
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

###### ios.json

```json
{
  "properties": [
    {
      "name": "PROP_NAME",
      "value": "PROP_VALUE",
      "type": "PROP_TYPE",
      "category": "PROP_CATEGORY"
    }
  ]
}
```

*Note*: PROP_NAME will be set to [camelCase](https://lodash.com/docs#camelCase)

###### android.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
  <property name="PROP_NAME" type="PROP_TYPE" category="PROP_CATEGORY">PROP_VALUE</property>
  <color name="PROP_NAME" type="color" category="PROP_CATEGORY">PROP_VALUE</color>
</resources>
```

*Note*: PROP_NAME will be set to upper case

###### scss

```scss
$PROP_NAME: PROP_VALUE;
```

*Note*: PROP_NAME will be set to [kebabCase](https://lodash.com/docs#kebabCase)

###### sass

```sass
$PROP_NAME: PROP_VALUE
```

*Note*: PROP_NAME will be set to [kebabCase](https://lodash.com/docs#kebabCase)

###### less

```less
@PROP_NAME: PROP_VALUE;
```

*Note*: PROP_NAME will be set to [kebabCase](https://lodash.com/docs#kebabCase)

###### scss

```styl
PROP_NAME = PROP_VALUE;
```

*Note*: PROP_NAME will be set to [kebabCase](https://lodash.com/docs#kebabCase)

###### aura.theme

```xml
<aura:theme>
  <aura:var name="PROP_NAME" value="PROP_VALUE" />
</aura:theme>
```

*Note*: PROP_NAME will be set to [camelCase](https://lodash.com/docs#camelCase)

###### styleguide

See [salesforce-ux.github.io/design-properties]()

***

####`theo.plugins.legacy()`

Transform legacy Theo *Design Properties* to the new spec

#### Example:

```js
gulp.src('./design/props-old.json')
  .pipe(theo.plugins.legacy());
```
