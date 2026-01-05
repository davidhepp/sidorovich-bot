const js = require("@eslint/js");
const tsParser = require("@typescript-eslint/parser");
const tsPlugin = require("@typescript-eslint/eslint-plugin");

module.exports = [
  {
    ignores: ["eslint.config.*", "node_modules/**", "dist/**", "**/*.d.ts"],
  },

  js.configs.recommended,

  {
    files: ["**/*.ts", "**/*.d.ts"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      "arrow-spacing": ["warn", { before: true, after: true }],
      "brace-style": "off",
      "comma-dangle": "off",
      "comma-spacing": "error",
      "comma-style": "error",
      curly: ["error", "multi-line", "consistent"],
      "dot-location": ["error", "property"],
      "handle-callback-err": "off",
      indent: "off",
      "keyword-spacing": "error",
      "max-nested-callbacks": ["error", { max: 4 }],
      "max-statements-per-line": ["error", { max: 2 }],
      "no-console": "off",
      "no-empty-function": "error",
      "no-floating-decimal": "error",
      "no-inline-comments": "error",
      "no-lonely-if": "error",
      "no-multi-spaces": "error",
      "no-multiple-empty-lines": ["error", { max: 2, maxEOF: 1, maxBOF: 0 }],
      "no-shadow": ["error", { allow: ["err", "resolve", "reject"] }],
      "no-trailing-spaces": ["error"],
      "no-var": "error",
      "no-undef": "off",
      "object-curly-spacing": ["error", "always"],
      "prefer-const": "error",
      quotes: "off",
      semi: ["error", "always"],
      "space-before-blocks": "error",
      "space-before-function-paren": [
        "error",
        {
          anonymous: "never",
          named: "never",
          asyncArrow: "always",
        },
      ],
      "space-in-parens": "error",
      "space-infix-ops": "error",
      "space-unary-ops": "error",
      "spaced-comment": "error",
      yoda: "error",
    },
  },
];
