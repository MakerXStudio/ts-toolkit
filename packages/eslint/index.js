module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'node', 'prettier'],
  extends: [
    'eslint:recommended',
    'plugin:node/recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  rules: {
    'prettier/prettier': 'warn',
    'no-console': 'warn',
    "node/no-unsupported-features/es-syntax": "off",
    '@typescript-eslint/no-unused-vars': ['warn', { ignoreRestSiblings: true, "argsIgnorePattern": "^_", "destructuredArrayIgnorePattern": "^_"  }],
    'prefer-template': 'error',
  },
}
