import globals from 'globals'
import eslintmakerx from '@makerx/eslint-config/flat.js'
import eslintConfigPrettier from 'eslint-config-prettier/flat'

export default [
  {
    ignores: [
      '**/.eslintrc.js',
      '**/node_modules',
      '**/dist',
      '**/build',
      '**/coverage',
      '**/generated/types.d.ts',
      '**/generated/types.ts',
      '**/.idea',
      '**/.vscode',
    ],
  },
  ...eslintmakerx,
  eslintConfigPrettier,
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
]
