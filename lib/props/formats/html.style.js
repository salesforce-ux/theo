/*
Copyright (c) 2015, salesforce.com, inc. All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
Neither the name of salesforce.com, inc. nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

module.exports = `

  html {
    box-sizing: border-box;
    font-size: 1em;
    font-family: Helvetica, Arial, sans-serif;
    line-height: 1.5;
    background: #fff;
    color: #444;
  }

  *,
  *:before,
  *:after {
    box-sizing: inherit;
  }

  body { font-size: .75rem; }

  ::-moz-selection {
    background: #b3d4fc;
    text-shadow: none;
  }

  ::selection {
    background: #b3d4fc;
    text-shadow: none;
  }

  .banner,
  .contentinfo { background: #f5f5f5; }

  .banner { padding: 1em 0; }

  .container {
    margin: 0 auto;
    padding: 0 2rem;
    max-width: 80rem;
  }

  main {
    margin-right: -2rem;
    margin-left:  -2rem;
    padding-bottom: 2rem;
  }

  h1 {
    margin: 0;
    font-weight: normal;
    line-height: 1.25;
  }

  table {
    table-layout: fixed;
    border-collapse: separate;
    border-spacing: 1rem;
    width: 100%;
  }

  th,
  td {
    padding: 0 1rem;
    vertical-align: baseline;
    word-break: break-word;
    hyphens: auto;
  }

  th {
    font-weight: normal;
    text-align: left;
  }

  thead th {
    border-bottom: 1px solid #eee;
    padding-top: 1rem;
    padding-bottom: .5rem;
    color: #999;
  }

  thead th:first-child {
    font-size: 1.25rem;
    color: inherit;
  }

  code { font-family: monaco, Consolas, monospace, monospace; }

  hr {
    display: block;
    margin: 2rem 0;
    border: 0;
    border-top: 1px solid #eee;
    padding: 0;
    height: 1px;
  }

  .metric-box,
  .radius-box {
    display: inline-block;
    vertical-align: middle;
    background: #eee;
  }

  .radius-box {
    width: 100%;
    height: 3rem;
  }

  .radius-box.borderRadiusCircle {
    width: 3rem;
  }

  .line-height-example {
    border-bottom: 1px solid #eee;
    background-image: -webkit-linear-gradient(#eee 1px, transparent 1px);
    background-image: linear-gradient(#eee 1px, transparent 1px);
    background-size: 100% 1rem;
  }

`
