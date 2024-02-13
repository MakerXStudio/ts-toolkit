import { init } from '../src/init'
import { ExistingFileBehaviour, InitPlatform } from '../src/init/init-options'

await init({
  existingFileBehaviour: ExistingFileBehaviour.Overwrite,
  platform: InitPlatform.Node,
  noInstall: true,
  noScripts: false,
  workingDirectory: process.cwd(),
})
