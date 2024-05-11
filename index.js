// @ts-check

const { resolve: resolveExports } = require("resolve.exports");
const path = require("path");
const fs = require("fs");
const { builtinModules } = require("module");
const { cleanSource, findPackageJson } = require("./utils");

exports.interfaceVersion = 2;

/**
 * Resolve the module id.
 *
 * @param {string} source import source
 * @param {string} file file
 * @param {import("resolve.exports").Options} config config
 *
 * @returns {{found: boolean, path?: string | null}} result
 */
exports.resolve = function (source, file, config) {
  if (source.startsWith(".") || source.startsWith("/")) {
    return { found: false };
  }

  const cleanedSource = cleanSource(source);

  if (builtinModules.includes(cleanedSource)) {
    return { found: true, path: null };
  }

  const filepath = path.dirname(file);

  try {
    const moduleId = require.resolve(cleanedSource, {
      paths: [filepath],
    });

    return { found: true, path: moduleId };
  } catch (/** @type {any} */ e) {
    if (e.code === "MODULE_NOT_FOUND") {
      let packageJson;

      // if the source is a package.json file
      if (e.path && e.path.endsWith("/package.json")) {
        packageJson = e.path;
      } else {
        // get the package name from the source
        const [packageNameOrScope, packageNameOrPath] = cleanedSource.split(
          "/",
          3
        );

        const packageName = packageNameOrScope.startsWith("@")
          ? packageNameOrScope + "/" + packageNameOrPath
          : packageNameOrScope;

        packageJson = findPackageJson(filepath, packageName);
      }

      if (!packageJson) {
        return { found: false };
      }

      const { exports, main, module, name } = require(packageJson);

      const resolved = resolveExports(
        { name, exports, module, main },
        cleanedSource,
        config
      );

      if (!resolved || resolved.length === 0) {
        return { found: false };
      }

      const packagePath = path.dirname(packageJson);

      if (resolved.length === 1) {
        const moduleId = path.join(packagePath, resolved[0]);

        return { found: true, path: moduleId };
      }

      /**
       * if there are multiple resolutions, we will try to resolve them
       * find the first one that exists and return it
       */
      for (const r of resolved) {
        const moduleId = path.join(packagePath, r);

        if (fs.existsSync(moduleId)) {
          return { found: true, path: moduleId };
        }
      }
    }
  }

  return { found: false };
};
