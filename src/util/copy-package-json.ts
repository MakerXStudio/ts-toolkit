import { join } from 'path'
import { readJson, writeJson } from './json'

// everything except scripts, devDependencies
// https://docs.npmjs.com/cli/v8/configuring-npm/package-json
export const sectionWhitelist = [
  'name',
  'version',
  'description',
  'keywords',
  'homepage',
  'bugs',
  'license',
  'author',
  'contributors',
  'funding',
  'files',
  'main',
  'browser',
  'bin',
  'man',
  'directories',
  'repository',
  'config',
  'dependencies',
  'peerDependencies',
  'peerDependenciesMeta',
  'bundleDependencies',
  'optionalDependencies',
  'overrides',
  'engines',
  'os',
  'cpu',
  'private',
  'publishConfig',
]

export const copyPackageJson = (inputFolder: string, outputFolder: string, extraSections: string[] = []) => {
  const packageJson = readJson(join(inputFolder, 'package.json'))
  const sectionsToUse = [...sectionWhitelist, ...extraSections]
  const output = Object.entries(packageJson).reduce<Record<string, unknown>>((acc, [key, value]) => {
    if (sectionsToUse.includes(key)) acc[key] = value
    return acc
  }, {})
  writeJson(join(outputFolder, 'package.json'), output)
}
