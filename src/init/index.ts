import path from 'path'
import fs from 'fs'
import { configFiles } from './config-files'
import { checkPackages } from './check-packages'
import { addScripts } from './add-scripts'
import { InitOptions } from './init-options'

export async function init(options: InitOptions) {
  const packageJsonPath = getPackageJsonPath(options.workingDirectory)
  configFiles(options)
  await checkPackages(packageJsonPath, options)
  if (options.noScripts !== true) addScripts(packageJsonPath, options)
}

export function getPackageJsonPath(workingDirectory: string) {
  const packageJsonPath = path.join(workingDirectory, 'package.json')
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error('Could not locate package.json file. tstk should be run in the root of your package.')
  }
  return packageJsonPath
}
