#!/usr/bin/env node
// Copyright (c) 2015-present, salesforce.com, inc. All rights reserved
// Licensed under BSD 3-Clause - see LICENSE.txt or git.io/sfdc-license

const argv = require('optimist').argv;
const build = require('./scripts/build');


const options = {
  formats : argv._,
  packagePath : argv.path || argv.p || process.cwd(),
  distPath : argv.dist || argv.d || '.',
  fileName : argv.output || argv.o || 'token',
  source : argv.src || argv.s || 'token.yml',
  test : argv.test || argv.t || false
};

build(options, error => {
  if (error) {
    console.log(`💩  Oups, something went wrong: ${error}`);
    return process.exit(1);
  }
  return process.exit(0);
});
