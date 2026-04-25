import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { changeExtensions, copyPackageJsonFromConfig, rewriteEsmRelativeImports } from './copy-package-json-from-config'

describe('changeExtensions', () => {
  it('Prefixes `./` when there is no dir name', () => {
    expect(changeExtensions('test.ts', 'mjs')).toBe('./test.mjs')
  })
  it('Prefixes `./` when there is a dir name', () => {
    expect(changeExtensions('some-directory/test.ts', 'mjs')).toBe('./some-directory/test.mjs')
  })
})

describe('rewriteEsmRelativeImports', () => {
  let dir: string

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tstk-rewrite-'))
  })

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true })
  })

  it('Leaves specifiers that already have recognized extensions alone', () => {
    fs.writeFileSync(path.join(dir, 'a.d.ts'), '', 'utf-8')
    const input = `import './a.js'\nimport './a.json'\nimport './a.d.ts'`
    expect(rewriteEsmRelativeImports(input, dir)).toBe(input)
  })

  it('Leaves non-relative specifiers alone', () => {
    const input = `import 'node:fs'\nimport pkg from 'some-package'`
    expect(rewriteEsmRelativeImports(input, dir)).toBe(input)
  })

  it('Resolves file specifiers to .mjs so the .d.mts twin is paired under node16+ resolution', () => {
    fs.writeFileSync(path.join(dir, 'helper.d.ts'), '', 'utf-8')
    expect(rewriteEsmRelativeImports(`from './helper'`, dir)).toBe(`from './helper.mjs'`)
  })

  it('Resolves directory specifiers to /index.mjs', () => {
    fs.mkdirSync(path.join(dir, 'sub'))
    fs.writeFileSync(path.join(dir, 'sub', 'index.d.ts'), '', 'utf-8')
    expect(rewriteEsmRelativeImports(`from './sub'`, dir)).toBe(`from './sub/index.mjs'`)
  })

  it('Resolves when only a .d.mts twin exists alongside the source', () => {
    fs.writeFileSync(path.join(dir, 'esm-only.d.mts'), '', 'utf-8')
    expect(rewriteEsmRelativeImports(`from './esm-only'`, dir)).toBe(`from './esm-only.mjs'`)
  })

  it('Rewrites all three module-specifier shapes in one pass', () => {
    fs.writeFileSync(path.join(dir, 'helper.d.ts'), '', 'utf-8')
    const input = [`import { x } from './helper'`, `import './helper'`, `type T = typeof import('./helper').x`].join('\n')
    const expected = [`import { x } from './helper.mjs'`, `import './helper.mjs'`, `type T = typeof import('./helper.mjs').x`].join('\n')
    expect(rewriteEsmRelativeImports(input, dir)).toBe(expected)
  })

  it('Leaves specifiers that cannot be resolved alone', () => {
    expect(rewriteEsmRelativeImports(`from './does-not-exist'`, dir)).toBe(`from './does-not-exist'`)
  })
})

describe('copyPackageJsonFromConfig', () => {
  let workDir: string
  let sourcePackageJson: string
  let outDir: string

  beforeEach(() => {
    workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tstk-pkg-'))
    sourcePackageJson = path.join(workDir, 'package.json')
    outDir = path.join(workDir, 'dist')
    fs.mkdirSync(outDir, { recursive: true })
    fs.writeFileSync(
      sourcePackageJson,
      JSON.stringify({
        name: '@test/pkg',
        version: '1.0.0',
        dependencies: { foo: '1.0.0' },
        devDependencies: { bar: '1.0.0' },
      }),
      'utf-8',
    )
  })

  afterEach(() => {
    fs.rmSync(workDir, { recursive: true, force: true })
  })

  const readOutput = () => JSON.parse(fs.readFileSync(path.join(outDir, 'package.json'), 'utf-8'))

  it('Emits per-condition types when exportTypes is `both`', () => {
    copyPackageJsonFromConfig({
      packageJsonSource: sourcePackageJson,
      outDir,
      main: 'index.ts',
      exportTypes: 'both',
    })

    const out = readOutput()
    expect(out.exports['.']).toEqual({
      import: { types: './index.d.mts', default: './index.mjs' },
      require: { types: './index.d.cts', default: './index.js' },
    })
    // `import` must be declared before `require` for Node's conditional resolution
    expect(Object.keys(out.exports['.'])).toEqual(['import', 'require'])
    // `types` must be declared before `default` inside each condition
    expect(Object.keys(out.exports['.'].import)).toEqual(['types', 'default'])
    expect(Object.keys(out.exports['.'].require)).toEqual(['types', 'default'])
    // Top-level `types` is retained as a node10 fallback
    expect(out.types).toBe('./index.d.ts')
  })

  it('Emits ESM-only export shape when exportTypes is `module`', () => {
    copyPackageJsonFromConfig({
      packageJsonSource: sourcePackageJson,
      outDir,
      main: 'index.ts',
      exportTypes: 'module',
    })

    const out = readOutput()
    expect(out.exports['.']).toEqual({
      types: './index.d.ts',
      import: './index.mjs',
    })
    expect(out.main).toBeUndefined()
    expect(out.module).toBe('./index.mjs')
  })

  it('Emits CJS-only export shape when exportTypes is `commonjs`', () => {
    copyPackageJsonFromConfig({
      packageJsonSource: sourcePackageJson,
      outDir,
      main: 'index.ts',
      exportTypes: 'commonjs',
    })

    const out = readOutput()
    expect(out.exports['.']).toEqual({
      types: './index.d.ts',
      require: './index.js',
    })
    expect(out.main).toBe('./index.js')
    expect(out.module).toBeUndefined()
  })

  it('Duplicates .d.ts files to .d.mts and .d.cts in dual mode', () => {
    const nestedDir = path.join(outDir, 'nested')
    fs.mkdirSync(nestedDir, { recursive: true })
    fs.writeFileSync(path.join(outDir, 'index.d.ts'), 'export declare const x: number\n', 'utf-8')
    fs.writeFileSync(path.join(nestedDir, 'deep.d.ts'), 'export declare const y: string\n', 'utf-8')

    copyPackageJsonFromConfig({
      packageJsonSource: sourcePackageJson,
      outDir,
      main: 'index.ts',
      exportTypes: 'both',
    })

    for (const file of ['index.d.mts', 'index.d.cts']) {
      expect(fs.existsSync(path.join(outDir, file))).toBe(true)
      expect(fs.readFileSync(path.join(outDir, file), 'utf-8')).toBe('export declare const x: number\n')
    }
    expect(fs.existsSync(path.join(nestedDir, 'deep.d.mts'))).toBe(true)
    expect(fs.existsSync(path.join(nestedDir, 'deep.d.cts'))).toBe(true)
  })

  it('Does not overwrite existing .d.mts / .d.cts produced by the build', () => {
    fs.writeFileSync(path.join(outDir, 'index.d.ts'), 'export declare const x: number\n', 'utf-8')
    fs.writeFileSync(path.join(outDir, 'index.d.mts'), '// hand-tuned ESM types\n', 'utf-8')

    copyPackageJsonFromConfig({
      packageJsonSource: sourcePackageJson,
      outDir,
      main: 'index.ts',
      exportTypes: 'both',
    })

    expect(fs.readFileSync(path.join(outDir, 'index.d.mts'), 'utf-8')).toBe('// hand-tuned ESM types\n')
    expect(fs.existsSync(path.join(outDir, 'index.d.cts'))).toBe(true)
  })

  it('Rewrites relative imports in the .d.mts copy so ESM resolution works', () => {
    const utilDir = path.join(outDir, 'util')
    fs.mkdirSync(utilDir, { recursive: true })
    fs.writeFileSync(path.join(utilDir, 'helper.d.ts'), 'export declare const helper: () => void\n', 'utf-8')
    fs.writeFileSync(
      path.join(outDir, 'index.d.ts'),
      [
        `import { helper } from './util/helper'`,
        `export { helper }`,
        `export * from './util/helper'`,
        `export type Lazy = typeof import('./util/helper').helper`,
        ``,
      ].join('\n'),
      'utf-8',
    )

    copyPackageJsonFromConfig({
      packageJsonSource: sourcePackageJson,
      outDir,
      main: 'index.ts',
      exportTypes: 'both',
    })

    const mtsContents = fs.readFileSync(path.join(outDir, 'index.d.mts'), 'utf-8')
    expect(mtsContents).toContain(`from './util/helper.mjs'`)
    expect(mtsContents).toContain(`import('./util/helper.mjs')`)
    expect(mtsContents).not.toContain(`from './util/helper'`)

    // The .d.cts should be content-identical to the original .d.ts
    const ctsContents = fs.readFileSync(path.join(outDir, 'index.d.cts'), 'utf-8')
    expect(ctsContents).toContain(`from './util/helper'`)
    expect(ctsContents).not.toContain(`from './util/helper.mjs'`)
  })

  it('Does not emit dual declarations in single-flavor modes', () => {
    fs.writeFileSync(path.join(outDir, 'index.d.ts'), 'export declare const x: number\n', 'utf-8')

    copyPackageJsonFromConfig({
      packageJsonSource: sourcePackageJson,
      outDir,
      main: 'index.ts',
      exportTypes: 'module',
    })

    expect(fs.existsSync(path.join(outDir, 'index.d.mts'))).toBe(false)
    expect(fs.existsSync(path.join(outDir, 'index.d.cts'))).toBe(false)
  })
})
