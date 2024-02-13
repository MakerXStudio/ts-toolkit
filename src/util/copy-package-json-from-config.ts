import { readJson, writeJson } from './json'
import path, { join } from 'path'
import { pick } from './pick'
import { colorConsole } from '../color-console'
import { standardSectionWhitelist } from './copy-package-json'

export type ModuleType = 'module' | 'commonjs'
export interface PackageConfig {
  main?: string
  srcDir?: string
  outDir?: string
  exports?: Record<string, string>
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
    ...suppliedConfig,
  }

  const packageJson = readJson(config.packageJsonSource)

  const sectionsToUse = [...standardSectionWhitelist, ...(config.customSections ?? [])]
  const output = {
    ...pick(packageJson, ...sectionsToUse),
    main: changeExtensions(config.main, 'js'),
    module: changeExtensions(config.main, 'mjs'),
    types: changeExtensions(config.main, 'd.ts'),
    type: config.moduleType,
    bin: config.bin && mapObject(config.bin, (key, value) => [key, changeExtensions(value, config.moduleType == 'module' ? 'mjs' : 'js')]),
    exports:
      config.exports &&
      mapObject(config.exports, (key, value) => [
        key,
        {
          import: changeExtensions(value, 'mjs'),
          require: changeExtensions(value, 'js'),
          types: changeExtensions(value, 'd.ts'),
        },
      ]),
  }
  writeJson(join(config.outDir, 'package.json'), output)
  colorConsole.info`✅ package.json written to: ${config.outDir}`
}

function mapObject<TValue, TNewValue>(obj: Record<string, TValue>, map: (key: string, value: TValue) => [string, TNewValue]) {
  return Object.fromEntries(Object.entries(obj).map(([key, value]) => map(key, value)))
}

function changeExtensions(filePath: string, ext: string): string {
  return `${path.dirname(filePath)}/${path.basename(filePath).slice(0, -path.extname(filePath).length)}.${ext}`
}
