module.exports = theo => {
  theo.registerFormat("array.js", result => {
    // "result" is an Immutable.Map
    // https://facebook.github.io/immutable-js/
    return `
      module.exports = [
        ${result
          .get("props")
          .map(
            prop => `
          ['${prop.get("name")}', '${prop.get("value")}'],
        `
          )
          .toJS()}
      ]
    `;
  });
};
