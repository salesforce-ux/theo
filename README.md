theo
====

Theme tokenizer working with JSON input generating variables for:
- [Sass](http://sass-lang.com/)
- [Stylus](http://learnboost.github.io/stylus/)
- [Less](http://lesscss.org/)
- [Aura](http://documentation.auraframework.org/auradocs)
- [plist](http://en.wikipedia.org/wiki/Property_list)
- [XML](http://en.wikipedia.org/wiki/XML)
- HTML documentation

## Usage

You can use theo either via command line or as a node library.

### Command line

    npm install -g theo
    theo Sass ./variables ./output
    theo "Sass, Stylus, Less, Aura, plist, XML, HTML" ./variables ./output

### Library

    $ npm install theo --save-dev

Gruntfile.coffee example:

    fs = require 'fs'
    theo = require 'theo'

    module.exports = (grunt) ->

      grunt.initConfig
        pkg: grunt.file.readJSON 'package.json'
        clean: ["./dist"]

      grunt.loadNpmTasks 'grunt-contrib-clean'

      grunt.registerTask 'init', ->
        fs.mkdir "./dist", '0777' if not fs.existsSync("./dist")
        
      grunt.registerTask 'generate', ->
        theo.batch(['Aura', 'Sass', 'Stylus', 'Less', 'plist', 'XML', 'HTML'], './variables', './dist');

      grunt.registerTask 'default', ['clean', 'init', 'generate']


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

You could also start by cloning one of the [mock files](test/mock/s1base.json).

## Documentation

The generated HTML documentation supports the following categories:

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

## Develop & Test

To do test driven development you can run:

    make tdd

This will execute all tests whenever you change any JavaScript file.
It doesn't watch the [handlebars](http://handlebarsjs.com/) templates. In case you work on templates you need to run theo manually like:

    ./bin/theo HTML test/mock dist

In case you get permission denied make sure to make it executable:

    chmod a+x ./bin/theo

Before creating a pull request make sure to run tests:

    make test

## License

Copyright (c) 2014, salesforce.com, inc. All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
Neither the name of salesforce.com, inc. nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.