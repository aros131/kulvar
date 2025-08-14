module.exports = {
  extends: [
    'next/core-web-vitals',
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
  ],
  rules: {
  "@typescript-eslint/no-explicit-any": ["error", { fixToUnknown: true, ignoreRestArgs: true }],
  },
};
