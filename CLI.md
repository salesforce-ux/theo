# Theo CLI

Theo come with a [CLI](https://en.wikipedia.org/wiki/Command-line_interface) that allows you to use
`theo` to buld one or multiple tokens. The CLI forwards on the `formats`
and other relevant options to `theo` in order to build the token in the desired formats.

## Defaults & Conventions

By default, the `theo CLI` assume that you have a token file in the root of you project named `token.yml` :

```
yourTokenDir/
├── node_modules/
├── token.yml
└── package.json
```

and it will generate the following structure:

```
yourTokenDir/
├── node_modules/
├── token.yml
├── token.<format>
└── package.json
```

## Basic usage

```
$ theo <[formats]> [options]
```

### Formats

Formats are valid theo supported formats, check the [documentation](https://github.com/salesforce-ux/theo#available-formats) for a full list of supported formats.

Usage example with formats:
```
$ theo scss cssmodules.css
```

### Options

|Name|Description|Default|
|----|-----------|-------|
|`--path` \| `-p` |The absolute path where source token is located|`process.cwd`|
|`--dist` \| `-d` |The relative path where to generate the build|`.`|
|`--output` \| `-o` |The output filename|`token.<format>` |
|`--src` \| `-s` |The src file|`token.yml` |
|`--test` \| `-t` |Disable writing to files for the token (test build scenario)|`false` |


## NPM Scripts usage

Typically usage is within [npm scripts](https://docs.npmjs.com/misc/scripts):

```json
{
  "scripts": {
    "build": "theo scss cssmodules.css"
  }
}
```

the following result will be printed on your terminal:

```
✏️  scss tokens created at "yourToken/token.scss"
✏️  cssmodules.css tokens created at "yourToken/token.cssmodules.css"
```

and the following files will be written in your project directory:

```
yourTokenDir/
├── ...
├── token.scss
├── token.cssmodules.css
└── ...
```

## Lerna usage

The `theo CLI` can be used together with [lerna](https://github.com/lerna/lerna) to build specific tokens for specific pakacges in your monorepo, by relying on lerna `exec` command:

```
$ lerna exec theo scss common.js
```

Use `--` to pass flags:

```
$ lerna exec theo scss common.js -- -o fancyFilename
```

Please refer to the [lerna documentation](https://github.com/lerna/lerna#exec) for further info
