import { exec } from 'child_process'
import { promisify } from 'util'
import colors from '@colors/colors/safe'
import { readJson, writeJson } from '../util/json'
import { compareVersions } from 'compare-versions'
import fetch from 'cross-fetch'
const execPromise = promisify(exec)

export async function checkPackages(packageJsonPath: string, { noInstall }: { noInstall: boolean }) {
  const packageJson = readJson(packageJsonPath) as {
    devDependencies?: Record<string, string | undefined>
  }

  if (packageJson.devDependencies === undefined) packageJson.devDependencies = {}

  const packages: Record<string, string> = {
    '@makerx/eslint-config': 'latest',
    '@makerx/prettier-config': 'latest',
    '@makerx/ts-config': 'latest',
    typescript: '^4.7.0',
    eslint: '8.22.0',
    prettier: 'latest',
  }

  let hasChanges = false
  for (const [pkgName, version] of Object.entries(packages)) {
    console.info(`Checking for installed version of ${colors.blue(pkgName)}...`)
    const targetVersion = version === 'latest' ? await getPackageLatestVersion(pkgName) : version
    if (targetVersion === undefined) continue
    const installedVersion = packageJson.devDependencies[pkgName]
    if (installedVersion === undefined) {
      hasChanges = true
      packageJson.devDependencies[pkgName] = targetVersion
      console.info(`...adding version ${colors.cyan(targetVersion)}`)
    } else {
      if (compareVersions(installedVersion, targetVersion) < 0) {
        hasChanges = true
        packageJson.devDependencies[pkgName] = targetVersion
        console.info(`...upgrading from version ${colors.cyan(installedVersion)} to ${colors.cyan(targetVersion)}`)
      } else {
        console.info(`...version ${colors.cyan(installedVersion)} OK`)
      }
    }
  }
  if (hasChanges) {
    writeJson(packageJsonPath, packageJson)
    if (noInstall) {
      console.info(colors.cyan('Some packages were out of date, please run npm install to update them'))
    } else {
      console.info(colors.cyan('Installing new packages...'))
      await execPromise('npm install')
      console.info(colors.cyan('...done'))
    }
  } else {
    console.info('All packages are up to date')
  }
}

async function getPackageLatestVersion(packageName: string) {
  const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(packageName)}`)

  if (response.ok) {
    const packageMeta = (await response.json()) as { 'dist-tags': { latest: string } }
    return packageMeta['dist-tags'].latest
  }
  console.error(colors.red(`Unable to fetch latest package meta data for ${packageName}`))
  return undefined
}
