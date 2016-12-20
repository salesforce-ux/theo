/* eslint-env node, mocha */
/*
Copyright (c) 2015, salesforce.com, inc. All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
Neither the name of salesforce.com, inc. nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

const kebabCase = require('../lib/props/util/kebabCase')
const assert = require('assert')

// We're using our own version of kebabCase instead of Lodash's implementation
// because Lodash sees numbers as words:
// Lodash: A1 -> a-1
// Theo: A1 -> a1
describe('kebabCase', () => {
  it('should transform strings to lowercase', () =>
    assert.strictEqual(kebabCase('ABC'), 'abc'))
  it('should separate words with a dash', () => {
    assert.strictEqual(kebabCase('PascalCase'), 'pascal-case')
    assert.strictEqual(kebabCase('snake_case'), 'snake-case')
    assert.strictEqual(kebabCase('SNAKE_CASE'), 'snake-case')
    assert.strictEqual(kebabCase('sentence case'), 'sentence-case')
  })
  it('should keep numbers part of words', () => {
    assert.strictEqual(kebabCase('A1'), 'a1')
    assert.strictEqual(kebabCase('b1'), 'b1')
    assert.strictEqual(kebabCase('C_1'), 'c-1')
    assert.strictEqual(kebabCase('D 1'), 'd-1')
  })
})
