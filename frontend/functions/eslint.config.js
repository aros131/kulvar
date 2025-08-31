import { defineConfig } from 'eslint-define-config';
import eslintPluginReact from 'eslint-plugin-react';

export default defineConfig({
  languageOptions: {
    globals: {
      process: 'readonly',
      __dirname: 'readonly',
    },
    parserOptions: {
      ecmaVersion: 2021,
    },
  },
  plugins: {
    react: eslintPluginReact,
  },
  rules: {
    'no-restricted-globals': ['error', 'name', 'length'],
    'prefer-arrow-callback': 'error',
    quotes: ['error', 'double', { allowTemplateLiterals: true }],
  },
  // Convert overrides to an array
  overrides: [
    {
      files: ['**/*.spec.*'],
      env: {
        mocha: true,
      },
      rules: {},
    },
  ],
});
