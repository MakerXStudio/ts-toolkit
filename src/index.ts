import { Command, Option } from 'commander'
import { ExistingFileBehaviour, getPackageJsonPath, init } from './init'
import { checkPackages } from './init/check-packages'
import { copyPackageJson } from './util/copy-package-json'

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

  program
    .command('copy-package-json')
    .description(
      `Copies package.json into an output folder without the scripts, devDependencies and other non-standard sections you probably don't want in a published package`,
    )
    .argument('<inputFolder>', 'The cwd relative or absolute folder path to read package.json')
    .argument('<outputFolder>', 'The cwd relative or absolute folder path to write the modified package.json')
    .argument('[extraSections...]', 'Sections you wish to keep, on top of the standard sections, minus scripts and devDependencies')
    .action((inputFolder, outputFolder, extraSections) => {
      copyPackageJson(inputFolder, outputFolder, extraSections)
    })
  program.parse(args)
}
