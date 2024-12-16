import { exec } from 'child_process'
import { promisify } from 'util'
import { readJson, writeJson } from '../util/json'
import { compareVersions } from 'compare-versions'
import { InitOptions, InitPlatform } from './init-options'
import { colorConsole } from '../color-console'

const execPromise = promisify(exec)

const basePackages: Record<string, string> = {
  '@makerx/eslint-config': 'latest',
  '@makerx/prettier-config': 'latest',
  typescript: 'latest',
  eslint: 'latest',
  prettier: 'latest',
  'better-npm-audit': 'latest',
  '@eslint/js': 'latest',
  'typescript-eslint': 'latest',
  'eslint-config-prettier': 'latest',
  'eslint-plugin-prettier': 'latest',
}

const nodePackages: Record<string, string> = {
  '@makerx/ts-toolkit': 'latest',
  '@tsconfig/node20': 'latest',
  '@types/node': 'latest',
  '@rollup/plugin-json': 'latest',
  '@rollup/plugin-node-resolve': 'latest',
  '@rollup/plugin-typescript': 'latest',
  '@rollup/plugin-commonjs': 'latest',
  'npm-run-all': 'latest',
  copyfiles: 'latest',
  rimraf: 'latest',
  rollup: 'latest',
  tsx: 'latest',
  vitest: 'latest',
  '@vitest/coverage-v8': 'latest',
}

export async function checkPackages(packageJsonPath: string, { noInstall, platform }: Pick<InitOptions, 'noInstall' | 'platform'>) {
  const packageJson = readJson(packageJsonPath) as {
    devDependencies?: Record<string, string | undefined>
  }

  if (packageJson.devDependencies === undefined) packageJson.devDependencies = {}

  const packages = {
    ...basePackages,
    ...(platform == InitPlatform.Node ? nodePackages : {}),
  }

  let hasChanges = false
  for (const [pkgName, version] of Object.entries(packages)) {
    colorConsole.info`Checking for installed version of ${pkgName}...`
    const targetVersion = version === 'latest' ? await getPackageLatestVersion(pkgName) : version
    if (targetVersion === undefined) continue
    const installedVersion = packageJson.devDependencies[pkgName]
    if (installedVersion === undefined) {
      hasChanges = true
      packageJson.devDependencies[pkgName] = targetVersion
      colorConsole.info`...adding version ${targetVersion}`
    } else if (installedVersion.startsWith('file:')) {
      colorConsole.warn`...found local package install, skipping version check`
    } else {
      if (compareVersions(installedVersion, targetVersion) < 0) {
        hasChanges = true
        packageJson.devDependencies[pkgName] = targetVersion
        colorConsole.info`...upgrading from version ${installedVersion} to ${targetVersion}`
      } else {
        colorConsole.info`...version ${installedVersion} OK`
      }
    }
  }
  if (hasChanges) {
    writeJson(packageJsonPath, packageJson)
    if (noInstall) {
      colorConsole.info`Some packages were out of date, please run npm install to update them`
    } else {
      colorConsole.info`Installing new packages...`
      await execPromise('npm install')
      colorConsole.info`...done`
    }
  } else {
    colorConsole.info`All packages are up to date`
  }
}

async function getPackageLatestVersion(packageName: string) {
  const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(packageName)}`)

  if (response.ok) {
    const packageMeta = (await response.json()) as { 'dist-tags': { latest: string } }
    return packageMeta['dist-tags'].latest
  }
  colorConsole.error`Unable to fetch latest package meta data for ${packageName}`
  return undefined
}
