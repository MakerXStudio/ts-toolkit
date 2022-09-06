import { ExistingFileBehaviour, init } from './init'
import { Command, Option } from 'commander'

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
    .action(({ existingFileBehaviour, noScripts }) => {
      init({ workingDirectory, existingFileBehaviour: existingFileBehaviour as ExistingFileBehaviour, noScripts: Boolean(noScripts) })
    })
  program.parse(args)
}
