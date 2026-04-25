import { readJson, writeJson } from './json'
import * as fs from 'fs'
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
    exports: exports && mapObject(exports, (key, value) => [key, buildExportEntry(value, config.exportTypes)]),
  }
  writeJson(join(config.outDir, 'package.json'), output)
  colorConsole.info`✅ package.json written to: ${config.outDir}`

  if (config.exportTypes === 'both') {
    emitDualDeclarations(config.outDir)
  }
}

function buildExportEntry(value: string, exportTypes: ExportType) {
  if (exportTypes === 'module') {
    return {
      types: changeExtensions(value, 'd.ts'),
      import: changeExtensions(value, 'mjs'),
    }
  }
  if (exportTypes === 'commonjs') {
    return {
      types: changeExtensions(value, 'd.ts'),
      require: changeExtensions(value, 'js'),
    }
  }
  // Dual output: per-condition `types` so TypeScript resolves dependency types
  // in the matching module system. `import` must come before `require`, and
  // `types` must come before `default` inside each condition.
  return {
    import: {
      types: changeExtensions(value, 'd.mts'),
      default: changeExtensions(value, 'mjs'),
    },
    require: {
      types: changeExtensions(value, 'd.cts'),
      default: changeExtensions(value, 'js'),
    },
  }
}

// Produces .d.mts and .d.cts siblings for every .d.ts in outDir so ESM and
// CJS consumers each resolve types in their own module system. The .d.mts copy
// has its extensionless relative imports rewritten to `.mjs` so that TS's
// node16+ ESM resolution pairs each declaration with its .d.mts twin rather
// than the CJS-flavoured .d.ts. The .d.cts copy can be content-identical
// since CJS resolution tolerates extensionless specifiers.
function emitDualDeclarations(outDir: string) {
  if (!fs.existsSync(outDir)) return
  let emitted = 0
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(full)
      } else if (entry.isFile() && entry.name.endsWith('.d.ts') && !entry.name.endsWith('.d.mts') && !entry.name.endsWith('.d.cts')) {
        const base = full.slice(0, -'.d.ts'.length)
        emitted += emitIfMissing(`${base}.d.mts`, () => rewriteEsmRelativeImports(fs.readFileSync(full, 'utf-8'), path.dirname(full)))
        emitted += emitIfMissing(`${base}.d.cts`, () => fs.readFileSync(full, 'utf-8'))
      }
    }
  }
  walk(outDir)
  if (emitted > 0) {
    colorConsole.info`✅ Emitted ${String(emitted)} dual declaration file(s) in: ${outDir}`
  }
}

function emitIfMissing(destination: string, produceContent: () => string): number {
  if (fs.existsSync(destination)) return 0
  fs.writeFileSync(destination, produceContent(), 'utf-8')
  return 1
}

// Rewrites relative specifiers in a declaration file for ESM resolution:
//   from './x'        → from './x.mjs'          (when ./x.d.ts or ./x.d.mts exists)
//   from './x'        → from './x/index.mjs'    (when ./x/index.d.ts or ./x/index.d.mts exists)
// The .mjs extension pairs the specifier with the adjacent .d.mts declaration
// under TS's node16+ resolver; using .js would resolve against the .d.ts
// (CJS-flavoured in a dual-published package) and surface as type errors in
// strict ESM consumers. Non-relative specifiers, already-extensioned
// specifiers, and unresolvable paths are left alone. Covers `from '...'`,
// bare `import '...'`, and dynamic `import('...')` forms.
export function rewriteEsmRelativeImports(source: string, sourceDir: string): string {
  const patterns = [
    /(\bfrom\s*)(['"])(\.{1,2}\/[^'"]+)\2/g,
    /(\bimport\s+)(['"])(\.{1,2}\/[^'"]+)\2/g,
    /(\bimport\s*\(\s*)(['"])(\.{1,2}\/[^'"]+)\2/g,
  ]
  return patterns.reduce(
    (acc, pattern) =>
      acc.replace(pattern, (match, prefix: string, quote: string, spec: string) => {
        const rewritten = rewriteSpecifier(spec, sourceDir)
        return rewritten ? `${prefix}${quote}${rewritten}${quote}` : match
      }),
    source,
  )
}

function rewriteSpecifier(spec: string, sourceDir: string): string | null {
  if (/\.(m?js|cjs|json|node|d\.m?ts|d\.cts|tsx?|jsx?)$/i.test(spec)) return null
  const candidate = path.resolve(sourceDir, spec)
  if (fs.existsSync(`${candidate}.d.ts`) || fs.existsSync(`${candidate}.d.mts`)) return `${spec}.mjs`
  if (fs.existsSync(path.join(candidate, 'index.d.ts')) || fs.existsSync(path.join(candidate, 'index.d.mts'))) {
    return spec.endsWith('/') ? `${spec}index.mjs` : `${spec}/index.mjs`
  }
  return null
}

function mapObject<TValue, TNewValue>(obj: Record<string, TValue>, map: (key: string, value: TValue) => [string, TNewValue]) {
  return Object.fromEntries(Object.entries(obj).map(([key, value]) => map(key, value)))
}

export function changeExtensions(filePath: string, ext: string): string {
  const dirName = path.dirname(filePath)
  return `${dirName == '.' ? '.' : `./${dirName}`}/${path.basename(filePath).slice(0, -path.extname(filePath).length)}.${ext}`
}
