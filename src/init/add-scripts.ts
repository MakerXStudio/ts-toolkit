import { readJson, writeJson } from '../util/json'
import { InitOptions, InitPlatform } from './init-options'
import { colorConsole } from '../color-console'

const baseScripts: Record<string, string> = {
  audit: 'better-npm-audit audit',
  format: 'prettier --write .',
  lint: 'eslint "src/**/*.ts"',
  'lint:fix': 'eslint "src/**/*.ts" --fix',
}

const nodeScripts: Record<string, string> = {
  build: 'run-s build:*',
  'build:0-clean': 'rimraf dist coverage',
  'build:1-lint': 'eslint "src/**/*.ts" --max-warnings 0',
  'build:2-check-types': 'tsc -p tsconfig.json',
  'build:3-build': 'rollup -c --configPlugin typescript',
  'build:4-copy-pkg-json': 'tstk copy-package-json -c',
  'build:5-copy-readme': 'copyfiles ./README.md ./dist',
  test: 'vitest run',
  'test:coverage': 'vitest run --coverage',
  'test:ci': 'vitest run --coverage --reporter junit --outputFile test-results.xml',
}

export function addScripts(packageFilePath: string, { platform }: InitOptions) {
  const scripts = {
    ...baseScripts,
    ...(platform == InitPlatform.Node ? nodeScripts : {}),
  }

  const packageJson = readJson(packageFilePath) as { scripts: Record<string, string> }
  let hasChanged = false
  Object.entries(scripts).forEach(([alias, def]) => {
    if (!packageJson.scripts[alias]) {
      colorConsole.info`Adding ${alias} script to package.json`
      packageJson.scripts[alias] = def
      hasChanged = true
    }
  })
  if (hasChanged) writeJson(packageFilePath, packageJson)
}
