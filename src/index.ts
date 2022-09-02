import * as path from 'path'
import * as fs from 'fs'

// The type definition for colors appears to be wrong :(
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import colors from '@colors/colors/safe'

const files = ['.editorconfig', '.eslintignore', '.eslintrc', '.gitattributes', '.gitignore', '.prettierrc', 'tsconfig.json']

export function cli(workingDirectory: string, args: string[]) {
  const packageJsonPath = path.join(workingDirectory, 'package.json')
  if (!fs.existsSync(packageJsonPath)) {
    console.error('Could not locate package.json file. tstk should be run in the root of your package.')
  }

  const skipExisting = args.includes('--skip-existing')
  const overwriteExisting = !skipExisting && args.includes('--overwrite-existing')

  for (const file of files) {
    const templatePath = path.join(__dirname, '../templates', `${file}.sample`)
    const outFilePath = path.join(workingDirectory, file)
    const exists = fs.existsSync(outFilePath)
    const templateData = fs.readFileSync(templatePath, 'utf-8')
    if (exists && skipExisting) {
      console.info(`Skipping existing file ${colors.green(outFilePath)}`)
      continue
    }
    if (exists && !overwriteExisting) {
      console.info(`File ${colors.green(outFilePath)} already exists, writing contents to ${colors.green(`${file}.sample`)} instead.`)
      fs.writeFileSync(path.join(workingDirectory, `${file}.sample`), templateData, 'utf-8')
    } else {
      console.info(`${exists ? 'Overwriting' : 'Creating'} file ${colors.green(outFilePath)}`)
      fs.writeFileSync(outFilePath, templateData, 'utf-8')
    }
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8')) as {
    devDependencies?: Record<string, string | undefined>
  }

  const packages = ['@makerx/eslint-config', '@makerx/prettier-config', '@makerx/ts-config', 'typescript', 'eslint', 'prettier']

  const missingPackages = []
  for (const pckg of packages) {
    if (packageJson.devDependencies?.[pckg] === undefined) {
      console.warn(`Missing package ${colors.blue(pckg)}`)
      missingPackages.push(pckg)
    }
  }
  console.info(`Please run ${colors.cyan(`npm i -D ${missingPackages.join(' ')}`)} to install the missing packages`)
}
