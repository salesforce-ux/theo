// Copyright (c) 2015-present, salesforce.com, inc. All rights reserved
// Licensed under BSD 3-Clause - see LICENSE.txt or git.io/sfdc-license

let groupBy = require("lodash/groupBy");
let camelCase = require("lodash/camelCase");
let upperfirst = require("lodash/upperFirst");

class Styleguide {
  constructor({ props, options }) {
    this.options = Object.assign(
      {
        transformPropName: camelCase
      },
      options
    );
    this.categories = groupBy(props, "category");
  }

  renderRowHeader(id, heading) {
    return `
      <thead>
        <tr id=${id}>
          <th scope="col">${heading}</th>
          <th scope="col">Value</th>
          <th scope="col">Examples</th>
          <th scope="col">Usage</th>
        </tr>
      </thead>
    `;
  }

  renderRow(prop, example) {
    let name = this.options.transformPropName(prop.name);
    return `
      <tr>
        <th scope="row">
          <code>${name}</code>
        </th>
        <td>
          <code>${prop.value}</code>
        </td>
        ${example}
        <td>${prop.comment ? prop.comment : ""}</td>
      </tr>
    `;
  }

  renderSpacing(props) {
    return props.map(prop => {
      let example = `
        <td>
          <div class="metric-box" style="width: ${prop.value}; height: ${
        prop.value
      };"></div>
        </td>
      `;
      return this.renderRow(prop, example);
    });
  }

  renderSizing(props) {
    return props.map(prop => {
      let example = `
        <td>
          <div class="metric-box" style="width: ${prop.value}; height: ${
        prop.value
      };"></div>
        </td>
      `;
      return this.renderRow(prop, example);
    });
  }

  renderFont(props) {
    return props.map(prop => {
      let example = `
        <td>
          <div style="font-family: ${prop.value};">
            The quick brown fox jumps over the lazy dog.
          </div>
        </td>
      `;
      return this.renderRow(prop, example);
    });
  }

  renderFontStyle(props) {
    return props.map(prop => {
      let example = `
        <td>
          <div style="font-style: ${prop.value};">
            The quick brown fox jumps over the lazy dog.
          </div>
        </td>
      `;
      return this.renderRow(prop, example);
    });
  }

  renderFontWeight(props) {
    return props.map(prop => {
      let example = `
        <td>
          <div style="font-weight: ${prop.value};">
            The quick brown fox jumps over the lazy dog.
          </div>
        </td>
      `;
      return this.renderRow(prop, example);
    });
  }

  renderFontSize(props) {
    return props.map(prop => {
      let example = `
        <td>
          <div style="font-size: ${prop.value};">
            The quick brown fox jumps over the lazy dog.
          </div>
        </td>
      `;
      return this.renderRow(prop, example);
    });
  }

  renderLineHeight(props) {
    return props.map(prop => {
      let vHeight = !isNaN(prop.value) ? `${prop.value}em` : prop.value;
      let example = `
        <td>
          <div class="line-height-example" style="line-height: ${
            prop.value
          }; background-size: 100% ${vHeight};">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec
            elementum odio et lacus rutrum molestie. Nunc arcu enim, elementum
            id feugiat at, venenatis quis erat.
          </div>
        </td>
      `;
      return this.renderRow(prop, example);
    });
  }

  renderFontFamily(props) {
    return props.map(prop => {
      let example = `
        <td>
          <div style="font-family: ${prop.value};">
            The quick brown fox jumps over the lazy dog.
          </div>
        </td>
      `;
      return this.renderRow(prop, example);
    });
  }

  renderBorderStyle(props) {
    return props.map(prop => {
      let example = `<td style="border: ${prop.value};"></td>`;
      return this.renderRow(prop, example);
    });
  }

  renderBorderColor(props) {
    return props.map(prop => {
      let example = `<td style="border: 2px solid ${prop.value};"></td>`;
      return this.renderRow(prop, example);
    });
  }

  renderHrColor(props) {
    return props.map(prop => {
      let example = `
        <td>
          <hr style="border-top-color: ${prop.value};" />
        </td>
      `;
      return this.renderRow(prop, example);
    });
  }

  renderRadius(props) {
    return props.map(prop => {
      let name = this.options.transformPropName(prop.name);
      let example = `
        <td>
          <div class="radius-box ${name}" style="border-radius: ${
        prop.value
      };"></div>
        </td>
      `;
      return this.renderRow(prop, example);
    });
  }

  renderBorderRadius(props) {
    return props.map(prop => {
      let example = `
        <td>
          <div class="radius-box" style="border-radius: ${prop.value};"></div>
        </td>
      `;
      return this.renderRow(prop, example);
    });
  }

  renderBackgroundColor(props) {
    return props.map(prop => {
      let example = `<td style="background-color: ${
        prop.value
      }; border: 1px solid #f6f6f6;"></td>`;
      return this.renderRow(prop, example);
    });
  }

  renderGradient(props) {
    return props.map(prop => {
      let example = `<td style="background: ${prop.value};"></td>`;
      return this.renderRow(prop, example);
    });
  }

  renderBackgroundGradient(props) {
    return props.map(prop => {
      let example = `<td style="background-image: ${prop.value};"></td>`;
      return this.renderRow(prop, example);
    });
  }

  renderDropShadow(props) {
    return props.map(prop => {
      let example = `<td style="box-shadow: ${prop.value};"></td>`;
      return this.renderRow(prop, example);
    });
  }

  renderBoxShadow(props) {
    return props.map(prop => {
      let example = `<td style="box-shadow: ${prop.value};"></td>`;
      return this.renderRow(prop, example);
    });
  }

  renderTextColor(props) {
    return props.map(prop => {
      let example = `
        <td style="background-color: #f6f6f6; color: ${prop.value};">
          The quick brown fox jumps over the lazy dog.
        </td>
      `;
      return this.renderRow(prop, example);
    });
  }

  renderTextShadow(props) {
    return props.map(prop => {
      let example = `
        <td style="text-shadow: ${prop.value};">
          The quick brown fox jumps over the lazy dog.
        </td>
      `;
      return this.renderRow(prop, example);
    });
  }

  renderTime(props) {
    return props.map(prop => {
      let example = `<td></td>`;
      return this.renderRow(prop, example);
    });
  }

  renderMediaQuery(props) {
    return props.map(prop => {
      let example = `<td></td>`;
      return this.renderRow(prop, example);
    });
  }

  renderSection(type, heading, fn) {
    let props = this.categories[type];
    if (!props) {
      return "";
    }
    let name = upperfirst(camelCase(type));
    let render = typeof fn === "function" ? fn : this[`render${name}`];
    return `
      <section>
        <table>
          ${this.renderRowHeader(type, heading)}
          <tbody>
            ${render
              .call(this, props)
              .join("")
              .trim()}
          </tbody>
        </table>
        <hr />
      </section>
    `;
  }

  render() {
    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta http-equiv="X-UA-Compatible" content="IE=edge" />
          <title>Design Tokens</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/normalize/4.2.0/normalize.min.css" />
          <style>
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
          </style>
        </head>
        <body>
          <header role="banner" class="banner">
            <div class="container">
              <h1>Design Tokens</h1>
            </div>
          </header>
          <div class="container">
            <main role="main">
              ${this.renderSection("sizing", "Sizing")}
              ${this.renderSection("spacing", "Spacing")}
              ${this.renderSection("font", "Fonts")}
              ${this.renderSection("font-style", "Font Styles")}
              ${this.renderSection("font-weight", "Font Weights")}
              ${this.renderSection("font-size", "Font Sizes")}
              ${this.renderSection("line-height", "Line Heights")}
              ${this.renderSection("font-family", "Font Families")}
              ${this.renderSection("border-style", "Border Styles")}
              ${this.renderSection("border-color", "Border Colors")}
              ${this.renderSection("radius", "Radius")}
              ${this.renderSection("border-radius", "Border Radii")}
              ${this.renderSection("hr-color", "Horizontal Rule Colors")}
              ${this.renderSection("background-color", "Background Colors")}
              ${this.renderSection("gradient", "Gradients")}
              ${this.renderSection(
                "background-gradient",
                "Background Gradients"
              )}
              ${this.renderSection("drop-shadow", "Drop Shadows")}
              ${this.renderSection("box-shadow", "Box Shadows")}
              ${this.renderSection(
                "inner-shadow",
                "Inner Drop Shadows",
                this.renderDropShadow
              )}
              ${this.renderSection("text-color", "Text Colors")}
              ${this.renderSection("text-shadow", "Text Shadows")}
              ${this.renderSection("time", "Time")}
              ${this.renderSection("media-query", "Media Queries")}
            </main>
          </div>
        </body>
      </html>
    `;
  }
}

module.exports = result => {
  const styleguide = new Styleguide(result.toJS());
  return styleguide.render();
};
