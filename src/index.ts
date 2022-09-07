import { ExistingFileBehaviour, getPackageJsonPath, init } from './init'
import { Command, Option } from 'commander'
import { checkPackages } from './init/check-packages'

const program = new Command()

export function cli(workingDirectory: string, args: string[]) {
  program
    .command('init')
    .description('Scaffolds several config files into the current working directory')
    .addOption(
      new Option('-efb --existing-file-behaviour <action>', 'Defines how existing files are handled.')
        .choices(['sample', 'skip', 'overwrite'])
        .default('sample', 'Write sample file'),
    )
    .addOption(
      new Option('-p --platform <platform>', 'The platform of the target application. Used when platform specific config is available.')
        .choices(['node'])
        .default('node'),
    )
    .option('-ns --no-scripts', "Don't append any scripts to the package.json file")
    .option('-ni --no-install', "Don't run npm install even if package versions have changed")
    .action(async ({ existingFileBehaviour, scripts, install }) => {
      await init({
        workingDirectory,
        existingFileBehaviour: existingFileBehaviour as ExistingFileBehaviour,
        noScripts: !scripts,
        noInstall: !install,
      })
    })

  program
    .command('check-packages')
    .description('Checks installed packages match a set of required packages and versions')
    .option('-ni --no-install', "Don't run npm install even if package versions have changed")
    .action(async ({ install }) => {
      await checkPackages(getPackageJsonPath(workingDirectory), { noInstall: !install })
    })
  program.parse(args)
}
