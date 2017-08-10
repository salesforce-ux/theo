// Copyright (c) 2015-present, salesforce.com, inc. All rights reserved
// Licensed under BSD 3-Clause - see LICENSE.txt or git.io/sfdc-license

const theo = require('../../lib')
const fs = require('fs-extra')
const path = require('path')
const each = require('async/each')

module.exports = function build (options, cb) {
  const {formats, packagePath, distPath, test, fileName, source} = options

  if (distPath !== '.' && !test) {
    fs.emptyDirSync(path.join(packagePath, distPath))
    console.log()
  }

  each(formats, (format, callback) => {
    const outputFile = path.join(distPath, `${fileName}.${format}`)
    theo.convert({
      transform: {
        type: 'raw',
        file: path.join(packagePath, source)
      },
      format: {
        type: format
      }
    })
    .then(data => {
      if (!test) {
        fs.outputFile(path.join(packagePath, outputFile), data)
          .then(() => console.log(`✏️  ${format} tokens created at "${path.basename(packagePath)}/${outputFile}"`))
        callback()
      } else {
        console.log(`✓ ${path.basename(packagePath)}/${outputFile} compiled correctly`)
        callback()
      }
    })
    .catch(callback)
  },
  cb
  )
}
