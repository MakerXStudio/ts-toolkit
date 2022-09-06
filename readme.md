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
npx tstk init --existing-file-behaviour <sample|overwrite|skip> --platform <node> --no-scripts
```

## Options

### Existing file behaviour (`--existing-file-behaviour` or `-efb`)

This option dictates how existing files are handled.  The default value is sample
 - sample - If a file already exists, write an additional <filename>.sample file
 - overwrite - If a file already exists, overwrite it
 - skip - If a file already exists, skip it

### Platform (`--platform` or `-p`)

Not used yet, but will be used to output platform specific files. The default value is node

### No Scripts (`--no-scripts` or `-ns`)

If provided, cli will skip adding any scripts to your package.json


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
