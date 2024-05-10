// @ts-check

const { resolve: resolveExports } = require("resolve.exports");
const path = require("node:path");
const fs = require("node:fs");
const { builtinModules } = require("node:module");

/**
 * Remove any trailing querystring from module id.
 * Some imports may have querystrings, for example:
 *  * import "foo?bar";
 *
 * @param {string} id module id
 */
function removeQuerystring(id) {
  const querystringIndex = id.lastIndexOf("?");

  if (querystringIndex > -1) {
    return id.slice(0, querystringIndex);
  }

  return id;
}

exports.interfaceVersion = 2;

/**
 * Resolve the module id.
 *
 * @param {string} source source
 * @param {string} file file
 * @param {import("resolve.exports").Options} config config
 */
exports.resolve = function (source, file, config) {
  if (source.startsWith(".") || source.startsWith("/")) {
    return { found: false };
  }

  if (builtinModules.includes(source)) {
    return { found: true, path: null };
  }

  const cleanedSource = removeQuerystring(source);

  try {
    const moduleId = require.resolve(cleanedSource, {
      paths: [path.dirname(file)],
    });

    return { found: true, path: moduleId };
  } catch (e) {
    if (
      e.code === "MODULE_NOT_FOUND" &&
      e.path &&
      e.path.endsWith("/package.json")
    ) {
      const { exports, main, module, name } = require(e.path);

      const resolved = resolveExports(
        { name, exports, module, main },
        cleanedSource,
        config
      );

      if (!resolved || resolved.length === 0) {
        return { found: false };
      }

      const packagePath = path.dirname(e.path);

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
