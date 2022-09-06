import fs from 'fs'
import { colours } from '../colours'

export function checkPackages(packageJsonPath: string) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8')) as {
    devDependencies?: Record<string, string | undefined>
  }

  const packages = ['@makerx/eslint-config', '@makerx/prettier-config', '@makerx/ts-config', 'typescript', 'eslint', 'prettier']

  const missingPackages = []
  for (const pckg of packages) {
    if (packageJson.devDependencies?.[pckg] === undefined) {
      console.warn(`Missing package ${colours.blue(pckg)}`)
      missingPackages.push(pckg)
    }
  }
  if (missingPackages.length)
    console.info(`Please run ${colours.cyan(`npm i -D ${missingPackages.join(' ')}`)} to install the missing packages`)
}
