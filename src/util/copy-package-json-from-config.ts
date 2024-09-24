import { readJson, writeJson } from './json'
import path, { join } from 'path'
import { pick } from './pick'
import { colorConsole } from '../color-console'
import { standardSectionWhitelist } from './copy-package-json'

export type ModuleType = 'module' | 'commonjs'
export type ExportType = 'module' | 'commonjs' | 'both'
export interface PackageConfig {
  main?: string
  srcDir?: string
  outDir?: string
  exports?: Record<string, string>
  exportTypes?: ExportType
  bin?: Record<string, string>
  customSections?: string[]
  packageJsonSource?: string
  moduleType?: ModuleType
}

export const copyPackageJsonFromConfig = (suppliedConfig: PackageConfig) => {
  const config = {
    main: 'index.ts',
    srcDir: 'src',
    outDir: 'dist',
    moduleType: 'commonjs' as ModuleType,
    packageJsonSource: 'package.json',
    exportTypes: 'both' as ExportType,
    ...suppliedConfig,
  }

  const packageJson = readJson(config.packageJsonSource)
  const exports = config.exports ?? {
    '.': config.main,
  }

  const sectionsToUse = [...standardSectionWhitelist, ...(config.customSections ?? [])]
  const output = {
    // Add an empty script block to be a valid package.json
    scripts: {},
    // Include all files in the package by default
    files: ['**'],
    ...pick(packageJson, ...sectionsToUse),
    main: config.exportTypes !== 'module' ? changeExtensions(config.main, 'js') : undefined,
    module: config.exportTypes !== 'commonjs' ? changeExtensions(config.main, 'mjs') : undefined,
    types: changeExtensions(config.main, 'd.ts'),
    type: config.moduleType,
    bin: config.bin && mapObject(config.bin, (key, value) => [key, changeExtensions(value, config.moduleType == 'module' ? 'mjs' : 'js')]),
    exports:
      exports &&
      mapObject(exports, (key, value) => [
        key,
        {
          types: changeExtensions(value, 'd.ts'),
          import: config.exportTypes !== 'commonjs' ? changeExtensions(value, 'mjs') : undefined,
          require: config.exportTypes !== 'module' ? changeExtensions(value, 'js') : undefined,
        },
      ]),
  }
  writeJson(join(config.outDir, 'package.json'), output)
  colorConsole.info`✅ package.json written to: ${config.outDir}`
}

function mapObject<TValue, TNewValue>(obj: Record<string, TValue>, map: (key: string, value: TValue) => [string, TNewValue]) {
  return Object.fromEntries(Object.entries(obj).map(([key, value]) => map(key, value)))
}

export function changeExtensions(filePath: string, ext: string): string {
  const dirName = path.dirname(filePath)
  return `${dirName == '.' ? '.' : `./${dirName}`}/${path.basename(filePath).slice(0, -path.extname(filePath).length)}.${ext}`
}
