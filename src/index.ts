import { Command, Option } from 'commander'
import path, { join } from 'path'
import { getPackageJsonPath, init } from './init'
import { checkPackages } from './init/check-packages'
import { copyPackageJson } from './util/copy-package-json'
import { ExistingFileBehaviour, InitPlatform } from './init/init-options'
import { copyPackageJsonFromConfig, PackageConfig } from './util/copy-package-json-from-config'
import { colorConsole } from './color-console'
import { cosmiconfig } from 'cosmiconfig'

const program = new Command()

export function cli(workingDirectory: string, args: string[]) {
  program
    .command('init')
    .description(
      `Scaffolds several config files into the current working directory.

    eg. Init empty node repo
    init --platform node --include-ci

    eg. Init into existing node repo and overwrite existing config
    init --platform node -efb overwrite

    `,
    )
    .addOption(
      new Option('-efb --existing-file-behaviour [action]', 'Defines how existing files are handled.')
        .choices(['sample', 'skip', 'overwrite'])
        .default('sample', 'Write sample file'),
    )
    .addOption(
      new Option('-p --platform [platform]', 'The platform of the target application. Used when platform specific config is available.')
        .choices(['node', 'other'])
        .default('node'),
    )
    .option('-ci --include-ci', 'Include templates for github ci')
    .option('-ns --no-scripts', "Don't append any scripts to the package.json file")
    .option('-ni --no-install', "Don't run npm install even if package versions have changed")
    .action(async ({ existingFileBehaviour, scripts, install, platform, includeCi }) => {
      await init({
        workingDirectory,
        existingFileBehaviour: existingFileBehaviour as ExistingFileBehaviour,
        noScripts: !scripts,
        noInstall: !install,
        platform: platform as InitPlatform,
        includeCi: Boolean(includeCi),
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
    .option('-if --input-folder [inputFolder]', 'The cwd relative or absolute folder path to read package.json', '.')
    .option(
      '-of --output-folder [outputFolder]',
      'The cwd relative or absolute folder path to write the modified package.json',
      join('.', 'dist'),
    )
    .option(
      '-c --config [path-to-config]',
      'Read configuration file. Optionally specifying the file, otherwise standard cosmiconfig locations are checked Overrides other args.',
    )
    .option('-m --main [main]', 'The main field value', 'index.js')
    .option('-t --types [types]', 'The types field value', 'index.d.ts')
    .option('-cs --custom-sections [value...]', 'Custom sections you wish to copy', [])

    .action(
      async ({
        inputFolder,
        outputFolder,
        main,
        types,
        customSections,
        config,
      }: {
        inputFolder: string
        outputFolder: string
        config?: string | true
        main: string
        types: string
        customSections: string[]
      }) => {
        if (config) {
          const tsToolkitConfig = await loadTsToolkitConfig(config == true ? undefined : config, workingDirectory)
          if (tsToolkitConfig == false || !tsToolkitConfig.packageConfig) {
            colorConsole.error`Cannot copy package.json using config as the configuration file is invalid or missing`
            return
          }
          copyPackageJsonFromConfig(tsToolkitConfig.packageConfig)
        } else {
          copyPackageJson(inputFolder, outputFolder, main, types, customSections)
        }
      },
    )

  program.parse(args)
}

async function loadTsToolkitConfig(configFilePath: string | undefined, workingDirectory: string): Promise<TsToolkitConfig | false> {
  const explorer = cosmiconfig('tstoolkit')
  const cosmiSearch = configFilePath ? explorer.load(path.join(workingDirectory, configFilePath)) : explorer.search(workingDirectory)
  try {
    const searchResult = await cosmiSearch
    if (searchResult == null) {
      colorConsole.error`Cannot find config`
      return false
    }
    colorConsole.info`Found config at ${searchResult.filepath}`
    return searchResult.config
  } catch (e) {
    colorConsole.error`Cannot find config: ${e}`
    return false
  }
}

export interface TsToolkitConfig {
  packageConfig?: PackageConfig
}
