theo
====

Theme tokenizer working with JSON input generating variables for:
- [Sass](http://sass-lang.com/)
- [Stylus](http://learnboost.github.io/stylus/)
- [Less](http://lesscss.org/)
- [Aura](http://documentation.auraframework.org/auradocs)
- [plist](http://en.wikipedia.org/wiki/Property_list)
- [XML](http://en.wikipedia.org/wiki/XML)

## Usage

    npm install theo
    theo Sass ./variables ./output
    theo "Sass, Stylus, Less, Aura, plist, XML" ./variables ./output

The input folder `./variables` in this examples should contain at least one JSON file with the following format:

    {
      "theme": {
        "name": "Name of the theme",
        "properties": [
          {
            "name":"COLOR_PRIMARY",
            "value":"#2a94d6"
          },
          {
            "name":"COLOR_LINK",
            "value":"#006eb3"
          }
        ]
      }
    }

You could also start by cloning one of the [mock files](test/mock/s1base.json).

## Test

Run tests with:

    make test

## License

Copyright (c) 2014, salesforce.com, inc. All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
Neither the name of salesforce.com, inc. nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.