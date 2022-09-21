import { Command, Option } from 'commander'
import { join } from 'path'
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
      `Copies package.json into an output folder without scripts, devDependencies and custom sections you probably don't want in a published package
      e.g. with defaults:
        copy-package-json
      or with all args:
        copy-package-json --input-folder ./subfolder --output-folder ./dist/subfolder --main 'app.js' --types 'app.d.ts' --custom-sections extraSection1 extraSection2`,
    )
    .option('-if --input-folder <inputFolder>', 'The cwd relative or absolute folder path to read package.json', '.')
    .option(
      '-of --output-folder <outputFolder>',
      'The cwd relative or absolute folder path to write the modified package.json',
      join('.', 'dist'),
    )
    .option('-m --main <main>', 'The main field value', 'index.js')
    .option('-t --types <types>', 'The types field value', 'index.d.ts')
    .option('-cs --custom-sections [value...]', 'Custom sections you wish to copy', [])
    .action(({ inputFolder, outputFolder, main, types, customSections }) => {
      copyPackageJson(inputFolder, outputFolder, main, types, customSections)
    })
  program.parse(args)
}
