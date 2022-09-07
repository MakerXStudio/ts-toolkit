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
}

export function init({ workingDirectory, existingFileBehaviour, noScripts }: InitOptions) {
  const packageJsonPath = path.join(workingDirectory, 'package.json')
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error('Could not locate package.json file. tstk should be run in the root of your package.')
  }
  configFiles(workingDirectory, existingFileBehaviour)
  checkPackages(packageJsonPath)
  if (noScripts !== true) addScripts(packageJsonPath)
}
