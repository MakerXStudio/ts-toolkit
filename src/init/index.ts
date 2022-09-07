import path from 'path'
import fs from 'fs'
import { configFiles, ExistingFileBehaviour } from './config-files'
import { checkPackages } from './check-packages'
import { addScripts } from './add-scripts'
export { ExistingFileBehaviour } from './config-files'

export interface InitOptions {
  existingFileBehaviour: ExistingFileBehaviour
  workingDirectory: string
  noScripts?: boolean
  noInstall: boolean
}

export async function init({ workingDirectory, existingFileBehaviour, noScripts, noInstall }: InitOptions) {
  const packageJsonPath = getPackageJsonPath(workingDirectory)
  configFiles(workingDirectory, existingFileBehaviour)
  await checkPackages(packageJsonPath, { noInstall })
  if (noScripts !== true) addScripts(packageJsonPath)
}

export function getPackageJsonPath(workingDirectory: string) {
  const packageJsonPath = path.join(workingDirectory, 'package.json')
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error('Could not locate package.json file. tstk should be run in the root of your package.')
  }
  return packageJsonPath
}
