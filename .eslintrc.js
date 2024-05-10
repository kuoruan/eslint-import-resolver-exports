/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  env: {
    node: true,
    es6: true,
  },
  parserOptions: {
    ecmaVersion: 6,
  },
  extends: ["eslint:recommended", "plugin:prettier/recommended"],
};
