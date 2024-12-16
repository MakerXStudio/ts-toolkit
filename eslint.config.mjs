import globals from 'globals'
import eslintmakerx from '@makerx/eslint-config/flat.js'

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
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
]
