const js = require("@eslint/js");

module.exports = [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: {
        process: "readonly",
        __dirname: "readonly",
        require: "readonly",
        module: "readonly",
        console: "readonly",
        setInterval: "readonly",
        setTimeout: "readonly",
        jest: "readonly",
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly"
      }
    },
    rules: {
      "no-unused-vars": "off",
      "no-useless-assignment": "off",
      "preserve-caught-error": "off",
      "no-empty": "off",
      "no-useless-assignment": "off",
      "no-undef": "error"
    }
  }
];
