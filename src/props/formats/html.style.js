/*
Copyright (c) 2015, salesforce.com, inc. All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
Neither the name of salesforce.com, inc. nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

module.exports = `
  
  * { -moz-box-sizing: border-box; box-sizing: border-box; }

  html {
    background: #fff;
    color: #444;
  }

  body,
  h1,
  h2,
  h3,
  h4,
  dl,
  dd,
  p { margin: 0; }

  body {
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    background-color: white;
    -webkit-font-smoothing: antialiased;
  }

  ::-moz-selection { background: #b3d4fc; }
  ::selection { background: #b3d4fc; }

  header,
  footer,
  main { display: block; }

  main {
    margin: 0 -0.5em;
    padding-top: 2em;
    padding-bottom: 2em;
  }

  h1,
  h2,
  h3,
  h4 {
    padding: 0;
    font-weight: normal;
    line-height: 1.2;
  }

  h1 { font-size: 2em; }

  h2 {
    margin-top: 0;
    padding: 1.5em 0 .5em;
    font-size: 1.5em;
  }

  h4 { color: #ccc; }


  p { padding: .75em 0; }

  a {
    text-decoration: none;
    background: transparent;
  }

  a,
  a:visited { color: #369; }

  a:focus,
  a:hover,
  a:active { color: #036; }

  a:hover,
  a:active { outline: 0; }

  strong { font-weight: bold; }

  hr {
    -moz-box-sizing: content-box;
         box-sizing: content-box;
    display: block;
    margin: 1em 0;
    border: 0;
    border-top: 1px solid #ccc;
    padding: 0;
    height: 1px;
  }

  code {
    font-size: 1em;
    font-family: monospace, monospace;
  }

  table {
    border-collapse: separate;
    border-spacing: 0 .5em;
    width: 100%;
  }


  th,
  td {
    padding: 0 .5em;
    vertical-align: baseline;
    -ms-word-break: break-all;
        word-break: break-all;
        word-break: break-word;
    -webkit-hyphens: auto;
       -moz-hyphens: auto;
        -ms-hyphens: auto;
            hyphens: auto;
  }

  th {
    font-weight: normal;
    text-align: left;
    border-bottom: 1px solid #eee;
    padding: 1.5em .4em .5em;
    color: #ccc;
  }

  th:first-child {
    color: #333;
    font-size: 1.5em;
    min-width: 8em;
  }

  .banner,
  .contentinfo { background: #f5f5f5; }

  .banner { padding: 1em 0; }

  .container {
    margin: 0 auto;
    padding: 0 1em;
    max-width: 80em;
    overflow: hidden;
  }

  .example { width: 20em; }

  .description,
  .contentinfo p { font-size: .75em; }

  .description { width: 26.66666666666667em; }

  .metric-box,
  .radius-box {
    display: inline-block;
    vertical-align: middle;
    background: #ccc;
  }

  .radius-box {
    width: 100%;
    height: 1.125em;
  }

  .line-height-example {
    border-bottom: 1px solid #ccc;
    background-image: -webkit-linear-gradient(#ccc 1px, transparent 1px);
    background-image: linear-gradient(#ccc 1px, transparent 1px);
    background-size: 100% 1em;
  }
  
`;