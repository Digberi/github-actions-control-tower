// Real application-source lint plus an isolated intentionally broken fixture.
export default [
  {
    files: ["quality/style/*.mjs", "src/**/*.mjs"],
    rules: {
      eqeqeq: ["error", "always"],
      curly: ["error", "all"],
      semi: ["error", "always"],
      "no-extra-semi": "error"
    }
  }
];
