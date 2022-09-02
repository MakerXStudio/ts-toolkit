# @makerx/ts-toolkit

A simple cli utility to assist in standardising several boilerplate files across our typescript repositories.

The files it concerns itself with are:
 - .editorconfig
 - .eslintignore
 - .eslintrc
 - .gitattributes
 - .gitignore
 - .prettierrc
 - tsconfig.json

The cli will output a starter version of these files which can then be extended to suit an individual project's needs. Where possible these files extend a base configuration file in a separate package (eg `@makerx/eslint-config` or `@makerx/prettier-config`). These packages may evolve over time and the latest can be obtained via npm (eg. `npm i -D @makerx/eslint-config@latest`)

## Usage

```shell
npm i -D @makerx/ts-toolkit
```

```shell
tstk
~or~
npx tstk
```

## Arguments

The default behavior of the cli is to _not_ override existing files. If a file already exists, the cli will output a new file named EXISTING_FILE_NAME.sample. For existing repos you can use this to compare the two files. You can specify the argument `--skip-existing` to modify this behaviour, and simple skip over existing files, or the `--overwrite-existing` argument will cause the cli to overwrite existing files.

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
