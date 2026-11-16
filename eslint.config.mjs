// Narrow, dependency-free ESLint flat configuration for the lecture fixture
// and the business-domain module. No application source is rewritten.
export default [
  {
    files: ["quality/style/*.mjs", "src/domain.mjs"],
    rules: {
      eqeqeq: ["error", "always"],
      curly: ["error", "all"],
      semi: ["error", "always"],
      "no-extra-semi": "error"
    }
  }
];
