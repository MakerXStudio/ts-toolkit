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
  outDir?: string
  include(options: InitOptions): boolean
}

const always = () => true
const nodeOnly = (options: InitOptions) => options.platform == InitPlatform.Node

const nodeCiOnly = (options: InitOptions) => nodeOnly(options) && options.includeCi == true

const allFiles: ConfigFile[] = [
  { name: 'readme.md', neverReplace: true, include: always },
  { name: '.eslintignore', include: always },
  { name: '.editorconfig', include: always },
  { name: '.eslintrc', altNames: ['.eslintrc.js', '.eslintrc.json'], include: always },
  { name: '.gitattributes', include: always },
  { name: '.gitignore', include: always },
  { name: '.nsprc', include: always },
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
    include: always,
  },
  { name: '.prettierignore', include: always },
  { name: '.tstoolkitrc.ts', templateDir: 'node', include: nodeOnly },
  { name: 'rollup.config.ts', templateDir: 'node', include: nodeOnly },
  { name: 'tsconfig.json', templateDir: 'node', include: nodeOnly },
  { name: 'tsconfig.build.json', templateDir: 'node', include: nodeOnly },
  { name: 'dependabot.yml', outDir: '.github', templateDir: 'node/ci', include: nodeCiOnly },
  { name: 'pr.yml', outDir: '.github/workflows', templateDir: 'node/ci', include: nodeCiOnly },
  { name: 'publish.yml', outDir: '.github/workflows', templateDir: 'node/ci', include: nodeCiOnly },
]

function getExistingFilePath(workingDirectory: string, file: ConfigFile): string | undefined {
  const outFilePath = path.join(workingDirectory, file.outDir ?? './', file.name)
  if (fs.existsSync(outFilePath)) return outFilePath

  return file.altNames
    ?.map((altName) => path.join(workingDirectory, file.outDir ?? './', altName))
    .find((altFilePath) => fs.existsSync(altFilePath))
}

const dirName = path.dirname(fileURLToPath(import.meta.url))

function getTemplatePath(configFile: ConfigFile) {
  return path.join(...[dirName, '../templates', configFile.templateDir || './', `${configFile.name}.sample`])
}

export function configFiles(options: InitOptions) {
  const { existingFileBehaviour, workingDirectory } = options
  const files = allFiles.filter((f) => f.include(options))
  for (const file of files) {
    const templatePath = getTemplatePath(file)
    const outFilePath = path.join(workingDirectory, file.outDir ?? './', file.name)
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
