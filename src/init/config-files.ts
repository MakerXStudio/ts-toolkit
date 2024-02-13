import path from 'path'
import fs from 'fs'
import { ExistingFileBehaviour, InitOptions, InitPlatform } from './init-options'
import { fileURLToPath } from 'node:url'
import { colorConsole } from '../color-console'

type ConfigFile = {
  name: string
  neverReplace?: boolean
  altNames?: string[]
  templateDir?: string
}

const baseFiles: ConfigFile[] = [
  { name: 'readme.md', neverReplace: true },
  { name: '.eslintignore' },
  { name: '.editorconfig' },
  { name: '.eslintrc', altNames: ['.eslintrc.js', '.eslintrc.json'] },
  { name: '.gitattributes' },
  { name: '.gitignore' },
  { name: '.nsprc' },
  {
    name: '.prettierrc.cjs',
    altNames: [
      '.prettierrc',
      '.prettierrc.json',
      '.prettierrc.config.js',
      '.prettierrc.cjs',
      '.prettierrc.js',
      '.prettierrc.config.cjs',
      '.prettierrc.yaml',
      '.prettierrc.yml',
      '.prettierrc.toml',
    ],
  },
  { name: '.prettierignore' },
]

const nodeFiles: ConfigFile[] = [
  { name: 'rollup.config.ts', templateDir: 'node' },
  { name: 'tsconfig.json', templateDir: 'node' },
  { name: 'tsconfig.build.json', templateDir: 'node' },
]

function getExistingFilePath(workingDirectory: string, file: ConfigFile): string | undefined {
  const outFilePath = path.join(workingDirectory, file.name)
  if (fs.existsSync(outFilePath)) return outFilePath

  return file.altNames?.map((altName) => path.join(workingDirectory, altName)).find((altFilePath) => fs.existsSync(altFilePath))
}

const dirName = path.dirname(fileURLToPath(import.meta.url))

function getTemplatePath(configFile: ConfigFile) {
  return path.join(...[dirName, '../templates', configFile.templateDir || './', `${configFile.name}.sample`])
}

export function configFiles({ existingFileBehaviour, workingDirectory, platform }: InitOptions) {
  const files = [...baseFiles, ...(platform == InitPlatform.Node ? nodeFiles : [])]
  for (const file of files) {
    const templatePath = getTemplatePath(file)
    const outFilePath = path.join(workingDirectory, file.name)
    const existingFilePath = getExistingFilePath(workingDirectory, file)
    const templateData = fs.readFileSync(templatePath, 'utf-8')
    if (existingFilePath && (existingFileBehaviour === ExistingFileBehaviour.Skip || file.neverReplace)) {
      colorConsole.info`Skipping existing file ${existingFilePath}`
      continue
    }
    if (existingFilePath && existingFileBehaviour !== ExistingFileBehaviour.Overwrite) {
      colorConsole.info`File ${existingFilePath} already exists, writing contents to ${`${file.name}.sample`} instead.`

      fs.writeFileSync(path.join(workingDirectory, `${file.name}.sample`), templateData, 'utf-8')
    } else {
      if (existingFilePath && existingFilePath !== outFilePath) {
        colorConsole.info`Removing existing file ${existingFilePath} as it will be replaced with ${outFilePath}`
        fs.rmSync(existingFilePath)
      } else {
        colorConsole.info`${existingFilePath ? 'Overwriting' : 'Creating'} file ${outFilePath}`
      }
      fs.writeFileSync(outFilePath, templateData, 'utf-8')
    }
  }
}
