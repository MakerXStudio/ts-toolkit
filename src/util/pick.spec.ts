import { describe, it, expect } from 'vitest'
import { pick } from './pick'

describe('pick', () => {
  const testObject = {
    a: 1,
    b: false,
    c: 'hello',
  }
  describe('when picking properties from an object which exist', () => {
    it('Returns an object with just those properties ', () => {
      const picked = pick(testObject, 'a', 'b')
      expect(Object.keys(picked).length).toBe(2)
      expect(picked.a).toBe(1)
      expect(picked.b).toBe(false)
      expect(Object.hasOwn(picked, 'c')).toBe(false)
    })
  })
})
