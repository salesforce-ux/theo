module.exports = theo => {
  theo.registerFormat("array.js", result => {
    let items = result
      .get("props")
      .map(prop => `\n  ['${prop.get("name")}', '${prop.get("value")}'],`)
      .toJS();
    return `module.exports = [${items}\n]`;
  });
};
