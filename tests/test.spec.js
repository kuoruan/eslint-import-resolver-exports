const path = require("path");
const { expect } = require("chai");
const { resolve } = require("../index");

const nodeModules = path.join(__dirname, "fixtures", "node_modules");

const sourceFile = path.join(__dirname, "fixtures", "source.js");

describe("test buildins", () => {
  it("lagacy require", () => {
    expect(resolve("fs", sourceFile)).deep.equal({
      found: true,
      path: null,
    });
  });

  it("with node: prefix", () => {
    expect(resolve("node:fs", sourceFile)).deep.equal({
      found: true,
      path: null,
    });
  });
});

describe("test module", () => {
  it("should pass", () => {
    expect(resolve("simple-module", sourceFile)).deep.equal({
      found: true,
      path: path.join(nodeModules, "simple-module", "index.js"),
    });
  });
});
