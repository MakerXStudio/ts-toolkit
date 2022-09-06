import { readJson, writeJson } from '../util/json'
import { colours } from '../colours'

const scripts: Record<string, string> = {
  format: 'prettier --write .',
  lint: 'eslint "src/**/*.ts" --fix',
}

export function addScripts(packageFilePath: string) {
  const packageJson = readJson(packageFilePath) as { scripts: Record<string, string> }
  let hasChanged = false
  Object.entries(scripts).forEach(([alias, def]) => {
    if (!packageJson.scripts[alias]) {
      console.info(`Adding ${colours.cyan(alias)} script to package.json`)
      packageJson.scripts[alias] = def
      hasChanged = true
    }
  })
  if (hasChanged) writeJson(packageFilePath, packageJson)
}
