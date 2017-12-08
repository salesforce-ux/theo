const Immutable = require("immutable-ext");

module.exports = def =>
  JSON.stringify(
    def
      .get("props")
      .reduce(
        (a, b, c) => a.set(b.get("name"), b.get("value")),
        Immutable.OrderedMap()
      ),
    null,
    2
  );
