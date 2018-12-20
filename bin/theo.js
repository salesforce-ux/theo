#!/usr/bin/env node
// Copyright (c) 2015-present, salesforce.com, inc. All rights reserved
// Licensed under BSD 3-Clause - see LICENSE.txt or git.io/sfdc-license

const argv = require("optimist").argv;

const build = require("./scripts/build");

const options = {
  src: argv._[0],
  dest: argv.dest,
  setup: argv.setup,
  formats: (argv.format || "raw.json").split(","),
  transform: argv.transform || "raw",
  resolveMetaAliases: argv.resolveMetaAliases || false
};

build(options).catch(error => {
  console.log(`💩  Oops, something went wrong: ${error}`);
  return process.exit(1);
});
