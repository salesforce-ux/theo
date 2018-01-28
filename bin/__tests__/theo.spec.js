// Copyright (c) 2015-present, salesforce.com, inc. All rights reserved
// Licensed under BSD 3-Clause - see LICENSE.txt or git.io/sfdc-license

/* eslint-env jest */

const childProcess = require("child_process");

const exec = cmd =>
  new Promise((resolve, reject) => {
    childProcess.exec(cmd, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });

it("should exit 1 if no src is passed", () => {
  return exec(`node bin/theo.js --formats scss`).catch(e => {
    expect(e.code).toBe(1);
  });
});

it("should print the result if no --dest is passed", () => {
  return exec(
    `node bin/theo.js ./bin/__fixtures__/tokens.yml --format scss`
  ).then(result => {
    expect(result).toMatchSnapshot();
  });
});

it("should write the result to --dest", () => {
  return exec(
    `node bin/theo.js ./bin/__fixtures__/tokens.yml --format scss --dest .tmp`
  ).then(result => {
    expect(result).toMatchSnapshot();
  });
});

it("should pass through multiple formats (--format a,b,c)", () => {
  return exec(
    `node bin/theo.js ./bin/__fixtures__/tokens.yml --format scss,sass --dest .tmp`
  ).then(result => {
    expect(result).toContain("scss");
    expect(result).toContain("sass");
  });
});

it("should pass through transform (--transform)", () => {
  return exec(
    `node bin/theo.js ./bin/__fixtures__/tokens.yml --format scss --transform web`
  ).then(result => {
    expect(result).toMatchSnapshot();
  });
});

it("should load setup module and pass custom through transform (--setup)", () => {
  return exec(
    `node bin/theo.js ./bin/__fixtures__/tokens.yml ` +
      `--setup bin/__fixtures__/setup.js --format array.js`
  ).then(result => {
    expect(result).toMatchSnapshot();
  });
});
