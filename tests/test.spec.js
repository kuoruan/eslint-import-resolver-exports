const path = require("path");
const { expect } = require("chai");
const { resolve } = require("../index");

const nodeModules = path.join(__dirname, "fixtures", "node_modules");

const sourceFile = path.join(__dirname, "fixtures", "source.js");

describe("test buildins", () => {
  it("only module name", () => {
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

describe("test simple module", () => {
  it("with default", () => {
    expect(resolve("simple-module", sourceFile)).deep.equal({
      found: true,
      path: path.join(nodeModules, "simple-module", "index.js"),
    });
  });

  it('with "index.js"', () => {
    expect(resolve("simple-module/index.js", sourceFile)).deep.equal({
      found: true,
      path: path.join(nodeModules, "simple-module", "index.js"),
    });
  });

  it('with "index"', () => {
    expect(resolve("simple-module/index", sourceFile)).deep.oneOf([
      // it can be resolved with lagacy node version
      {
        found: true,
        path: path.join(nodeModules, "simple-module", "index.js"),
      },
      // with new node version
      {
        found: false,
      },
    ]);
  });

  it('with "lib"', () => {
    expect(resolve("simple-module/lib", sourceFile)).deep.equal({
      found: true,
      path: path.join(nodeModules, "simple-module/lib/index.js"),
    });
  });

  it('with "lib-alias"', () => {
    expect(resolve("simple-module/lib-alias", sourceFile)).deep.equal({
      found: true,
      path: path.join(nodeModules, "simple-module/lib/index.js"),
    });
  });
});
