/*
Copyright (c) 2015, salesforce.com, inc. All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
Neither the name of salesforce.com, inc. nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

let React = require('react');

let groupBy = require('lodash/collection/groupBy');
let camelCase   = require('lodash/string/camelCase');
let capitalize   = require('lodash/string/capitalize');

let Style = React.createClass({
  render() {
    return (
      <style>
        {require('./html.style')}
      </style>
    );
  }
});

let ExampleRow = React.createClass({
  render() {
    return (
      <td className="example" {...this.props}>
        {this.props.children}
      </td>
    );
  }
});

let Styleguide = React.createClass({

  getInitialState() {
    return {
      categories: groupBy(this.props.json.props, 'category')
    }
  },

  renderRowHeader(id, heading) {
    return (
      <tr key={`${id}-header`} id={id}>
        <th>{heading}</th>
        <th>Value</th>
        <th>Examples</th>
        <th>Usage</th>
      </tr>
    );
  },

  renderRow(prop, example) {
    let name = camelCase(prop.name);
    return (
      <tr key={`${prop.name}-row`}>
        <td>
          <code>{name}</code>
        </td>
        <td>
          <code>{prop.value}</code>
        </td>
        {example}
        <td className="description">
          {prop.comment}
        </td>
      </tr>
    )
  },

  renderBackgroundColor(props) {
    return props.map(prop => {
      let example = <ExampleRow style={{backgroundColor:prop.value, border:'1px solid #f2f2f2;'}} />
      return this.renderRow(prop, example);
    })
  },

  renderTextColor(props) {
    return props.map(prop => {
      let example = (
        <ExampleRow style={{color:prop.value}}>
          The quick brown fox jumps over the lazy dog.
        </ExampleRow>
      );
      return this.renderRow(prop, example);
    })
  },

  renderGradient(props) {
    return props.map(prop => {
      let example = <ExampleRow style={{background:prop.value}} />
      return this.renderRow(prop, example);
    })
  },

  renderBorderColor(props) {
    return props.map(prop => {
      let example = <ExampleRow style={{border:`2px solid ${prop.value}`}} />
      return this.renderRow(prop, example);
    })
  },

  renderBorderStyle(props) {
    return props.map(prop => {
      let example = <ExampleRow style={{border:prop.value}} />
      return this.renderRow(prop, example);
    })
  },

  renderHrColor(props) {
    return props.map(prop => {
      let example = (
        <ExampleRow>
          <hr style={{borderTopColor:prop.value}} />
        </ExampleRow>
      );
      return this.renderRow(prop, example);
    })
  },

  renderDropShadow(props) {
    return props.map(prop => {
      let example = <ExampleRow style={{boxShadow:prop.value}} />
      return this.renderRow(prop, example);
    })
  },

  renderFont(props) {
    return props.map(prop => {
      let example = (
        <ExampleRow>
          <div style={{fontFamily:prop.value}}>Aa</div>
        </ExampleRow>
      );
      return this.renderRow(prop, example);
    })
  },

  renderFontWeight(props) {
    return props.map(prop => {
      let example = (
        <ExampleRow>
          <div style={{fontWeight:prop.value}}>Aa</div>
        </ExampleRow>
      );
      return this.renderRow(prop, example);
    })
  },

  renderFontSize(props) {
    return props.map(prop => {
      let example = (
        <ExampleRow>
          <div style={{fontSize:prop.value}}>
            The quick brown fox jumps over the lazy dog.
          </div>
        </ExampleRow>
      );
      return this.renderRow(prop, example);
    })
  },

  renderTime(props) {
    return props.map(prop => {
      let example = (
        <ExampleRow />
      );
      return this.renderRow(prop, example);
    })
  },

  renderLineHeight(props) {
    return props.map(prop => {
      let vHeight = !isNaN(prop.value) ? `${prop.value}em` : prop.value;
      let example = (
        <ExampleRow>
          <div className="line-height-example" style={{lineHeight:prop.value, backgroundSize:`100% ${vHeight}`}}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            Donec elementum odio et lacus rutrum molestie. Nunc arcu enim, elementum id feugiat at,
            venenatis quis erat. Class aptent taciti sociosqu ad litora torquent per conubia nostra,
            per inceptos himenaeos. Mauris sit amet commodo velit. In hac habitasse platea dictumst.
            Sed ac velit dolor.
          </div>
        </ExampleRow>
      );
      return this.renderRow(prop, example);
    })
  },

  renderSpacing(props) {
    return props.map(prop => {
      let example = (
        <ExampleRow>
          <div className="metric-box" style={{width:prop.value, height:prop.value}} />
        </ExampleRow>
      );
      return this.renderRow(prop, example);
    })
  },

  renderRadius(props) {
    return props.map(prop => {
      let example = (
        <ExampleRow>
          <div className="radius-box" style={{borderRadius:prop.value}} />
        </ExampleRow>
      );
      return this.renderRow(prop, example);
    })
  },

  renderMediaQuery(props) {
    return props.map(prop => {
      let example = (
        <ExampleRow />
      );
      return this.renderRow(prop, example);
    })
  },

  renderSection(type, heading, fn) {
    let props = this.state.categories[type];
    if (!props) { return null; }
    let name = capitalize(camelCase(type));
    let render = typeof fn === 'function' ? fn : this[`render${name}`];
    return [
      this.renderRowHeader(type, heading),
      render.call(this, props)
    ];
  },

  render(json) {
    return (
      <html>
        <head>
          <meta charSet="utf-8" />
          <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
          <title>Design Property Guide</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <Style />
        </head>
        <body>
          <header role="banner" className="banner">
            <div className="container">
              <h1>Design Attribute Guide</h1>
            </div>
          </header>
            <div className="container">
              <main role="main">
                <table>
                  {this.renderSection('text-color', 'Text Colors')}
                  {this.renderSection('background-color', 'Background Colors')}
                  {this.renderSection('gradient', 'Gradients')}
                  {this.renderSection('border-color', 'Border Colors')}
                  {this.renderSection('border-style', 'Border Styles')}
                  {this.renderSection('hr-color', 'Horizontal Rule Colors')}
                  {this.renderSection('drop-shadow', 'Drop Shadows')}
                  {this.renderSection('inner-shadow', 'Inner Drop Shadows', this.renderDropShadow)}
                  {this.renderSection('font', 'Fonts')}
                  {this.renderSection('font-weight', 'Font Weights')}
                  {this.renderSection('font-size', 'Font Sizes')}
                  {this.renderSection('line-height', 'Line Heights')}
                  {this.renderSection('spacing', 'Spacing')}
                  {this.renderSection('radius', 'Radius')}
                  {this.renderSection('time', 'Time')}
                  {this.renderSection('media-query', 'Media Queries')}
                </table>
              </main>
            </div>
        </body>
      </html>
    )
  }
});

module.exports = function(json) {
  return `
    <!doctype html>
    ${React.renderToStaticMarkup(<Styleguide json={json} />)}
  `;
};