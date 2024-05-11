// @ts-check

const { resolve: resolveExports } = require("resolve.exports");
const path = require("path");
const fs = require("fs");
const { builtinModules } = require("module");

/**
 * Remove prefix and querystrings from the source.
 * When using node: prefix, we should remove it.
 * Some imports may have querystrings, for example:
 *  * import "foo?bar";
 *
 * @param {string} source the import source
 *
 * @retures {string} cleaned source
 */
function cleanSource(/** @type {string} */ source) {
  if (source.indexOf("node:") === 0) {
    return source.slice(5);
  }

  const querystringIndex = source.lastIndexOf("?");

  if (querystringIndex > -1) {
    return source.slice(0, querystringIndex);
  }

  return source;
}

exports.interfaceVersion = 2;

/**
 * Resolve the module id.
 *
 * @param {string} source source
 * @param {string} file file
 * @param {import("resolve.exports").Options} config config
 *
 */
exports.resolve = function (source, file, config) {
  if (source.startsWith(".") || source.startsWith("/")) {
    return { found: false };
  }

  const cleanedSource = cleanSource(source);

  if (builtinModules.includes(cleanedSource)) {
    return { found: true, path: null };
  }

  try {
    const moduleId = require.resolve(cleanedSource, {
      paths: [path.dirname(file)],
    });

    return { found: true, path: moduleId };
  } catch (/** @type {any} */ e) {
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
