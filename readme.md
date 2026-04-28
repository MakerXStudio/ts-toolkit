# @makerx/ts-toolkit

A simple cli utility to assist in standardising several boilerplate files across our typescript repositories.

The files it concerns itself with are:

- .editorconfig
- .eslintignore
- .eslintrc
- .gitattributes
- .gitignore
- .prettierrc.js
- .prettierignore
- tsconfig.json

The cli will output a starter version of these files which can then be extended to suit an individual project's needs. Where possible these files extend a base configuration file in a separate package (eg `@makerx/eslint-config` or `@makerx/prettier-config`). These packages may evolve over time and the latest can be obtained via npm (eg. `npm i -D @makerx/eslint-config@latest`)

It is recommended you commit all pending changes before running the cli so that you can compare and / or reset changes

## Usage

```shell
npx @makerx/ts-toolkit init --existing-file-behaviour <sample|overwrite|skip> --platform <node> --no-scripts
```

## Options

### Existing file behaviour (`--existing-file-behaviour` or `-efb`)

This option dictates how existing files are handled. The default value is sample

- sample - If a file already exists, write an additional <filename>.sample file
- overwrite - If a file already exists, overwrite it
- skip - If a file already exists, skip it

### Platform (`--platform` or `-p`)

Not used yet, but will be used to output platform specific files. The default value is node

### No Scripts (`--no-scripts` or `-ns`)

If provided, cli will skip adding any scripts to your package.json

### No Install (`--no-install` or `-ni`)

After adding new packages to your package.json, Toolkit will run `npm install` to install this packages. Passing in this parameter will disable that behaviour.

## copy-package-json

The ts-toolkit also includes a utility for copying your `package.json` file into a `dist` directory without superfluous sections like `devDependencies` and `scripts`. It will also replace key sections based on the arguments passed in

The basic version takes several arguments which detail explicit values for what is to be replaced

```shell
# e.g. with defaults:
tstk copy-package-json
# or with all args:
tstk copy-package-json --input-folder ./subfolder --output-folder ./dist/subfolder --main 'app.js' --types 'app.d.ts' --custom-sections extraSection1 extraSection2
```

An alternative option has been added in v4 which takes its arguments from a configuration file. ts-toolkit uses [cosmiconfig](https://github.com/cosmiconfig/cosmiconfig) so any of the compatible formats of cosmiconfig are supported. The recommended approach is to use a typescript file though as it will give you intellisense

> > > This feature is very experimental at this stage and may not work as expected for atypical scenarios (ie. ones which do not match this repo)

```ts
/* Sample .tstoolkitrc.ts */
import { TsToolkitConfig } from '@makerx/ts-toolkit'

const config: TsToolkitConfig = {
  packageConfig: {
    srcDir: 'src',
    outDir: 'dist',
    moduleType: 'module',
    main: 'index.ts',
    bin: {
      '@makerx/ts-toolkit': 'bin/run-cli.ts',
      tstk: 'bin/run-cli.ts',
    },
  },
}
export default config
```

File paths used in this config file should point to the typescript file relative to the source directory. The tool will translate this to relevant js/mjs/d.ts paths in the out directory.

### Dual type declarations (`exportTypes: 'both'`)

When `exportTypes` is `'both'`, the rewritten `package.json` declares per-condition `types` so each consumer resolves declarations in their own module system:

```jsonc
"exports": {
  ".": {
    "import":  { "types": "./index.d.mts", "default": "./index.mjs" },
    "require": { "types": "./index.d.cts", "default": "./index.js"  }
  }
}
```

For TypeScript to honour those conditions, the `.d.mts` and `.d.cts` files actually have to exist. `copy-package-json` produces them by duplicating each `.d.ts` emitted by the build:

- `*.d.cts` — byte-for-byte copy of `*.d.ts`. CJS resolution accepts extensionless relative specifiers, so no rewriting is needed.
- `*.d.mts` — copy with relative specifiers rewritten so the resolver pairs each declaration with its `.d.mts` twin rather than the `.d.ts`. Concretely:
  - `from './foo'` → `from './foo.mjs'` (when `./foo.d.ts` or `./foo.d.mts` exists)
  - `from './foo'` → `from './foo/index.mjs'` (when `./foo/index.d.ts` or `./foo/index.d.mts` exists)
  - `from './foo.js'`, `from 'some-package'`, and unresolvable paths are left alone.

The reason for `.mjs` (not `.js`): under `moduleResolution: "node16"`/`"nodenext"`, a `.js` specifier inside a `.d.mts` resolves against the adjacent `.d.ts`, which in a dual-published package whose root `package.json` has `"type": "commonjs"` is treated as CJS-flavoured. Strict-ESM consumers then surface type-resolution mismatches. Using `.mjs` keeps the resolution chain in ESM throughout.

If your build already emits `.d.mts`/`.d.cts` directly, `copy-package-json` won't overwrite them — duplication only fills in missing siblings.

## Sub-Packages

### @makerx/eslint-config

A set of default eslint plugins and rules

### @makerx/prettier-config

A default prettier configuration

### @makerx/ts-config

A default tsconfig configuration

## Contributing

### Releasing

Releases are set up to push a new version of each package when the version number is changed. If you don't change the version number, that package will not be re-published
