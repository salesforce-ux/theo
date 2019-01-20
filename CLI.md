# Theo CLI

Theo comes with a [CLI](https://en.wikipedia.org/wiki/Command-line_interface) that allows you to use
`theo` to build one or multiple tokens. The CLI forwards on the `formats`
and other relevant options to `theo` in order to build the token in the desired formats.

## Basic usage

```
$ theo <[file]> [options]
```

### Options

| Name                   | Description                                                                   | Default    |
| ---------------------- | ----------------------------------------------------------------------------- | ---------- |
| `--transform`          | valid theo transform                                                          | `raw`      |
| `--format`             | Comma separated list of valid theo formats                                    | `raw.json` |
| `--dest`               | The path where the result should be written                                   | stdout     |
| `--setup`              | The path to an optional JS module that can set up Theo before transformation. |            |
| `--resolveMetaAliases` | Resolve aliases in metadata                                                   | `false`    |

### transforms / formats

Formats are valid theo supported formats, check the [documentation](https://github.com/salesforce-ux/theo#available-formats) for a full list of supported transforms and formats.

Usage example with formats:

```
$ theo tokens.yml --transform web --format scss,cssmodules.css
$ theo tokens.yml --transform web --format scss,cssmodules.css --resolveMetaAliases
```

### setup module

A valid setup module exports a function that takes theo as the first argument.

Example module (example.js):

```
module.exports = theo => {
  theo.registerValueTransform(
    'addpx',
    prop => prop.get('type') === 'size',
    prop => prop.get('value') + 'px'
  );
  theo.registerTransform("web", ['addpx']);
}
```

Usage example with setup

```
$ theo tokens.yml --setup example.js --transform web --format scss
```

## npm scripts usage

Typically usage is within [npm scripts](https://docs.npmjs.com/misc/scripts):

```json
{
  "scripts": {
    "build": "theo tokens.yml --format scss,cssmodules.css --dest ."
  }
}
```

the following result will be printed on your terminal:

```
✏️  scss tokens created at "./tokens.scss"
✏️  cssmodules.css tokens created at "./tokens.cssmodules.css"
```

and the following files will be written in your project directory:

```
yourTokenDir/
├── ...
├── tokens.scss
├── tokens.cssmodules.css
└── ...
```
