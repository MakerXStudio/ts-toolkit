import * as fs from 'fs'

export function readJson(path: string) {
  return JSON.parse(fs.readFileSync(path, 'utf-8'))
}
export function writeJson(path: string, value: unknown) {
  fs.writeFileSync(path, JSON.stringify(value, undefined, 2), 'utf-8')
}
