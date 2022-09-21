import { join } from 'path'
import { readJson, writeJson } from './json'

// known sections except scripts, devDependencies, main, types and custom sections
// https://docs.npmjs.com/cli/v8/configuring-npm/package-json
export const standardSectionWhitelist = [
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

export const copyPackageJson = (inputFolder: string, outputFolder: string, main: string, types: string, customSections: string[] = []) => {
  const packageJson = readJson(join(inputFolder, 'package.json'))
  const sectionsToUse = [...standardSectionWhitelist, ...customSections]
  const output = { main, types, ...pick(packageJson, ...sectionsToUse) }
  writeJson(join(outputFolder, 'package.json'), output)
  console.info(`✅ package.json written to: ${outputFolder}`)
}

/**
 * Creates an object composed of the picked `object` properties.
 */
const pick = <T extends object, U extends keyof T>(object: T, ...props: U[]): Partial<T> => {
  return Object.entries(object).reduce<Partial<T>>((acc, [key, value]) => {
    if (props.includes(key as U)) acc[key as U] = value
    return acc
  }, {})
}
