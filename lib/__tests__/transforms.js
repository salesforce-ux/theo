// Copyright (c) 2015-present, salesforce.com, inc. All rights reserved
// Licensed under BSD 3-Clause - see LICENSE.txt or git.io/sfdc-license

/* eslint-env jest */

const Immutable = require("immutable-ext");

const { getValueTransform } = require("../register");

const get = name =>
  getValueTransform(name)
    .get()
    .get("transform");

describe("color/rgb", () => {
  const t = get("color/rgb");
  it("converts hex to rgb", () => {
    const p = Immutable.fromJS({ value: "#FF0000" });
    expect(t(p)).toEqual("rgb(255, 0, 0)");
  });
  it("converts rgba to rgba", () => {
    const p = Immutable.fromJS({ value: "rgba(255, 0, 0, 0.8)" });
    expect(t(p)).toEqual("rgba(255, 0, 0, 0.8)");
  });
  it("converts hsla to rgba", () => {
    const p = Immutable.fromJS({ value: "hsla(0, 100%, 50%, 0.8)" });
    expect(t(p)).toEqual("rgba(255, 0, 0, 0.8)");
  });
});

describe("color/hex", () => {
  const t = get("color/hex");
  it("converts rgb to hex", () => {
    const p = Immutable.fromJS({ value: "rgb(255, 0, 0)" });
    expect(t(p)).toEqual("#ff0000");
  });
  it("converts rgba to hex", () => {
    const p = Immutable.fromJS({ value: "rgb(255, 0, 0, 0.8)" });
    expect(t(p)).toEqual("#ff0000");
  });
  it("converts hsla to hex", () => {
    const p = Immutable.fromJS({ value: "hsla(0, 100%, 50%, 0.8)" });
    expect(t(p)).toEqual("#ff0000");
  });
});

describe("color/hex8rgba", () => {
  const t = get("color/hex8rgba");
  it("converts hex to hex8 (RRGGBBAA)", () => {
    const p = Immutable.fromJS({ value: "#FF0000" });
    expect(t(p)).toEqual("#ff0000ff");
  });
  it("converts rgba to hex8 (RRGGBBAA)", () => {
    const p = Immutable.fromJS({ value: "rgba(255, 0, 0, 0.8)" });
    expect(t(p)).toEqual("#ff0000cc");
  });
  it("converts hsla to hex8 (RRGGBBAA)", () => {
    const p = Immutable.fromJS({ value: "hsla(0, 100%, 50%, 0.8)" });
    expect(t(p)).toEqual("#ff0000cc");
  });
});

describe("color/hex8argb", () => {
  const t = get("color/hex8argb");
  it("converts hex to hex8 (AARRGGBB)", () => {
    const p = Immutable.fromJS({ value: "#FF0000" });
    expect(t(p)).toEqual("#ffff0000");
  });
  it("converts rgba to hex8 (AARRGGBB)", () => {
    const p = Immutable.fromJS({ value: "rgba(255, 0, 0, 0.8)" });
    expect(t(p)).toEqual("#ccff0000");
  });
  it("converts hsla to hex8 (AARRGGBB)", () => {
    const p = Immutable.fromJS({ value: "hsla(0, 100%, 50%, 0.8)" });
    expect(t(p)).toEqual("#ccff0000");
  });
});

describe("percentage/float", () => {
  const t = get("percentage/float");
  it("converts a percentage to a float", () => {
    const p = Immutable.fromJS({ value: "50%" });
    expect(t(p)).toEqual("0.5");
  });
  it("converts multiple percentages to a floats", () => {
    const p = Immutable.fromJS({ value: "background-size: 50% 50%" });
    expect(t(p)).toEqual("background-size: 0.5 0.5");
  });
});

describe("relative/pixel", () => {
  const t = get("relative/pixel");
  it("converts em to px", () => {
    const p = Immutable.fromJS({
      value: "1em",
      meta: { baseFontPercentage: 100, baseFontPixel: 16 }
    });
    expect(t(p)).toEqual("16px");
  });
  it("converts rem to px", () => {
    const p = Immutable.fromJS({
      value: "1rem",
      meta: { baseFontPercentage: 100, baseFontPixel: 16 }
    });
    expect(t(p)).toEqual("16px");
  });
  it("takes the baseFontPercentage into account", () => {
    const p = Immutable.fromJS({
      value: "1rem",
      meta: { baseFontPercentage: 50, baseFontPixel: 16 }
    });
    expect(t(p)).toEqual("8px");
  });
  it("takes the baseFontPixel into account", () => {
    const p = Immutable.fromJS({
      value: "1rem",
      meta: { baseFontPercentage: 100, baseFontPixel: 5 }
    });
    expect(t(p)).toEqual("5px");
  });
});

describe("relative/pixelValue", () => {
  const t = get("relative/pixelValue");
  it("converts em to px", () => {
    const p = Immutable.fromJS({
      value: "1em",
      meta: { baseFontPercentage: 100, baseFontPixel: 16 }
    });
    expect(t(p)).toEqual("16");
  });
  it("converts rem to px", () => {
    const p = Immutable.fromJS({
      value: "1rem",
      meta: { baseFontPercentage: 100, baseFontPixel: 16 }
    });
    expect(t(p)).toEqual("16");
  });
  it("takes the baseFontPercentage into account", () => {
    const p = Immutable.fromJS({
      value: "1rem",
      meta: { baseFontPercentage: 50, baseFontPixel: 16 }
    });
    expect(t(p)).toEqual("8");
  });
  it("takes the baseFontPixel into account", () => {
    const p = Immutable.fromJS({
      value: "1rem",
      meta: { baseFontPercentage: 100, baseFontPixel: 5 }
    });
    expect(t(p)).toEqual("5");
  });
});

describe("absolute/dp", () => {
  const t = get("absolute/dp");
  it("converts px to dp", () => {
    const p = Immutable.fromJS({
      value: "1px"
    });
    expect(t(p)).toEqual("1dp");
  });
});
