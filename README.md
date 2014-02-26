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
        "categories": [
          {
            "name": "Name of the category like colors",
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
        ]
      }
    }

You could also start by cloning one if the [mock files](test/mock/s1base.json).

## Test

Run tests with:

    make test

## License

[BSD 2-Clause License](LICENSE)