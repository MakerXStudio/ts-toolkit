import fs from 'fs'
import colors from '@colors/colors/safe'

export function checkPackages(packageJsonPath: string) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8')) as {
    devDependencies?: Record<string, string | undefined>
  }

  const packages = ['@makerx/eslint-config', '@makerx/prettier-config', '@makerx/ts-config', 'typescript', 'eslint', 'prettier']

  const missingPackages = []
  for (const pckg of packages) {
    if (packageJson.devDependencies?.[pckg] === undefined) {
      console.warn(`Missing package ${colors.blue(pckg)}`)
      missingPackages.push(pckg)
    }
  }
  if (missingPackages.length)
    console.info(`Please run ${colors.cyan(`npm i -D ${missingPackages.join(' ')}`)} to install the missing packages`)
}
