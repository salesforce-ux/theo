// Copyright (c) 2015-present, salesforce.com, inc. All rights reserved
// Licensed under BSD 3-Clause - see LICENSE.txt or git.io/sfdc-license

const theo = require("../../lib");
const fs = require("fs-extra");
const path = require("path");

module.exports = ({
  src = "",
  dest,
  setup,
  formats,
  transform,
  resolveMetaAliases
}) => {
  if (setup) {
    const setupModuleFile = path.resolve(process.cwd(), setup);
    require(setupModuleFile)(theo);
  }

  return Promise.all(
    formats.map(format =>
      theo
        .convert({
          transform: {
            type: transform,
            file: path.resolve(process.cwd(), src),
            resolveMetaAliases
          },
          format: {
            type: format
          }
        })
        .then(data => {
          if (dest) {
            const base = path.basename(src, path.extname(src));
            const fileBase = path.join(dest, `${base}.${format}`);
            const file = path.resolve(process.cwd(), fileBase);
            return fs
              .outputFile(file, data)
              .then(() =>
                console.log(`✏️  ${format} tokens created at "${fileBase}"`)
              );
          } else {
            console.log(data);
          }
        })
    )
  );
};
