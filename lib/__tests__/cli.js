// Copyright (c) 2015-present, salesforce.com, inc. All rights reserved
// Licensed under BSD 3-Clause - see LICENSE.txt or git.io/sfdc-license

const spawn = require('cross-spawn');
const path = require('path');


describe('CLI', () => {
  describe('when no token is found', () => {
    it('should exit with the correct code', done => {
      const args = [
        'common.js',
        '--test'
      ];
      const scriptProcess = spawn(
        'node',
        [require.resolve('../../bin/theo')].concat(args),
        { silent: true }
      );

      scriptProcess.on('close', (code, signal) => {
        expect(code).toBe(1);
        done();
      });
    });
  });

  describe('when a token is found', () => {
    describe('and the request formats are not valid', () => {
      it('should exit with the correct code', done => {
        const args = [
          'hispter.format',
          'hyper.css',
          '--test',
          `--path=${path.join(__dirname  ,'../__fixtures__')}`,
          '--src=a.json'
        ];
        const scriptProcess = spawn(
          'node',
          [require.resolve('../../bin/theo')].concat(args),
          { silent: true }
        );

        scriptProcess.on('close', code => {
          expect(code).toBe(1);
          done();
        });
      });
    });

    describe('and the request formats are valid', () => {
      it('should exit with the correct code', done => {
        const args = [
          'common.js',
          '--test',
          'cssmodules.css',
          `--path=${path.join(__dirname  ,'../__fixtures__')}`,
          '--src=a.json'
        ];

        const scriptProcess = spawn(
          'node',
          [require.resolve('../../bin/theo')].concat(args),
          { silent: true }
        );

        scriptProcess.on('close', code => {
          expect(code).toBe(0);
          done();
        });
      });
    });
  });
});
