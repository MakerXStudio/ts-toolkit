import { describe, expect, it } from 'vitest'
import { changeExtensions } from './copy-package-json-from-config'

describe('changeExtensions', () => {
  it('Prefixes `./` when there is no dir name', () => {
    expect(changeExtensions('test.ts', 'mjs')).toBe('./test.mjs')
  })
  it('Prefixes `./` when there is a dir name', () => {
    expect(changeExtensions('some-directory/test.ts', 'mjs')).toBe('./some-directory/test.mjs')
  })
})
