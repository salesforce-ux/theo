theo
====

A theme tokenizer that works with JSON input to generate variables for:

- [Sass](http://sass-lang.com)
- [Stylus](http://learnboost.github.io/stylus)
- [Less](http://lesscss.org)
- [Aura](http://documentation.auraframework.org/auradocs)
- [JSON](http://json.org/) targeting iOS
- [XML](http://en.wikipedia.org/wiki/XML) targeting Android
- HTML documentation

## Usage

You can use _theo_ either via command line or as a node library.

### Command line

    npm install -g theo

One output format:

    theo Sass ./variables ./output

Multiple output formats:

    theo "Sass, Stylus, Less, Aura, JSON, XML, HTML" ./variables ./output

Using theo to view alias usage:
    
    theo alias-usage ./variables
    ```
      Alias list pulled from the following files: aliases.json 

      Aliases found in the following files: s1base.json s1sub.json 

      white:..............................1
      black20:............................1
      black:..............................0
    ```

### Library

    $ npm install theo --save-dev

`Gruntfile.coffee` example:

    fs = require 'fs'
    theo = require 'theo'

    module.exports = (grunt) ->

      grunt.registerTask 'default', ->
        fs.mkdir './dist', '0777' if not fs.existsSync('./dist')
        theo.batch ['Aura', 'Sass', 'Stylus', 'Less', 'JSON', 'XML', 'HTML'], './variables', './dist'


### Variables

The input folder `./variables` in this examples should contain at least one JSON file with the following format:

    {
      "theme": {
        "name": "Name of the theme",
        "properties": [
          {
            "name":"COLOR_PRIMARY",
            "value":"#2a94d6",
            "category": "text-color",
            "comment": "Lorem ipsum"
          },
          {
            "name":"COLOR_LINK",
            "value":"#006eb3",
            "category": "text-color",
            "comment": "Lorem ipsum"
          }
        ]
      }
    }

Optionally _theo_ also supports aliases:

    {
      "theme": {
        "name": "Name of the theme",
        "aliases": [
          {
            "name": "blue",
            "value": "#2a94d6"
          }
        ],
        "properties": [
          {
            "name":"COLOR_PRIMARY",
            "value":"{!blue}",
            "category": "text-color",
            "comment": "Lorem ipsum"
          }
        ]
      }
    }

You could also start by cloning one of the [mock files](test/mock/s1base.json).

## Documentation

The generated HTML documentation supports the following categories:

- color
- text-color
- background-color
- border-color
- border-style
- font
- font-size
- line-height
- spacing
- drop-shadow
- inner-shadow
- hr-color
- radius
- gradient
- misc

This is an example of how the docs look like:
![Alt text](/assets/doc_example.png?raw=true "HTML Docs Example")

## Develop & Test

To do test driven development you can run:

    gulp tdd

This will execute all tests whenever you change any JavaScript file or template.

Before creating a pull request make sure to run the tests:

    gulp

## License

Copyright (c) 2014, salesforce.com, inc. All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
Neither the name of salesforce.com, inc. nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.