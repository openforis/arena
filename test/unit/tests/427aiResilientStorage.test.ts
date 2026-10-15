import {
  createResilientStorage,
  isQuotaExceededError,
  type ResilientStorageBackend,
} from '@webapp/ai/storage/resilientStorage'

const quotaError = () =>
  Object.assign(new Error('The quota has been exceeded.'), { name: 'QuotaExceededError', code: 22 })

/**
 * A Map-backed storage that throws the given error on writes while `failWrites` holds.
 * @param {object} [options] - Options.
 * @returns {object} The storage, its data and switches.
 */
const fakeStorage = ({
  maxLength = Infinity,
  error = quotaError,
}: { maxLength?: number; error?: () => Error } = {}) => {
  const data = new Map<string, string>()
  const calls = { setItem: 0 }
  const state = { blocked: false }
  const storage: ResilientStorageBackend = {
    getItem: (key) => {
      if (state.blocked) throw new Error('SecurityError')
      return data.get(key) ?? null
    },
    setItem: (key, value) => {
      calls.setItem += 1
      if (state.blocked) throw new Error('SecurityError')
      if (value.length > maxLength) throw error()
      data.set(key, value)
    },
    removeItem: (key) => {
      data.delete(key)
    },
    key: (index) => [...data.keys()][index] ?? null,
    get length() {
      return data.size
    },
  }
  return { storage, data, calls, state }
}

describe('resilient storage (427)', () => {
  test('quota errors of every browser are recognised', () => {
    expect(isQuotaExceededError(Object.assign(new Error('x'), { name: 'QuotaExceededError' }))).toBe(true)
    expect(isQuotaExceededError(Object.assign(new Error('x'), { name: 'NS_ERROR_DOM_QUOTA_REACHED' }))).toBe(true)
    expect(isQuotaExceededError({ code: 22 })).toBe(true)
    expect(isQuotaExceededError({ code: 1014 })).toBe(true)
    expect(isQuotaExceededError(new Error('Quota exceeded'))).toBe(true)
    expect(isQuotaExceededError(new Error('SecurityError'))).toBe(false)
    expect(isQuotaExceededError(null)).toBe(false)
  })

  test('a value is written and read back', () => {
    const { storage, data } = fakeStorage()
    const wrapper = createResilientStorage({ getStorage: () => storage, log: jest.fn() })
    wrapper.write('k', 'value')
    expect(data.get('k')).toBe('value')
    expect(wrapper.read('k')).toBe('value')
    wrapper.remove('k')
    expect(wrapper.read('k')).toBeNull()
  })

  test('a full storage: the caller shrinks the value level by level until it fits, and it is logged', () => {
    const { storage, data } = fakeStorage({ maxLength: 5 })
    const log = jest.fn()
    const wrapper = createResilientStorage({ getStorage: () => storage, log })
    const shrink = jest.fn((level: number) => 'x'.repeat(10 - level * 3))
    wrapper.write('k', 'x'.repeat(10), shrink)
    expect(shrink.mock.calls.map(([level]) => level)).toEqual([1, 2])
    expect(data.get('k')).toBe('xxxx'.slice(0, 4))
    expect(wrapper.read('k')).toBe('xxxx')
    expect(log).toHaveBeenCalledTimes(1)
    expect(log).toHaveBeenCalledWith(expect.stringMatching(/full.*k.*pruned.*level 2/))
  })

  test('nothing fits: the value stays in memory, is read from there, and the log says so', () => {
    const { storage, data, calls, state } = fakeStorage({ maxLength: 2 })
    const log = jest.fn()
    const wrapper = createResilientStorage({ getStorage: () => storage, log })
    data.set('k', 'old')
    wrapper.write('k', 'too long', () => null)
    expect(log).toHaveBeenCalledWith(expect.stringMatching(/full.*k.*memory/))
    // the older stored value must not come back over the newer one
    expect(wrapper.read('k')).toBe('too long')
    expect(calls.setItem).toBe(1)
    // a later write that fits goes to the storage again
    wrapper.write('k', 'ok')
    expect(data.get('k')).toBe('ok')
    expect(wrapper.read('k')).toBe('ok')
    expect(state.blocked).toBe(false)
  })

  test('without a shrink function a full storage goes straight to memory (no retry)', () => {
    const { storage, calls } = fakeStorage({ maxLength: 2 })
    const wrapper = createResilientStorage({ getStorage: () => storage, log: jest.fn() })
    wrapper.write('k', 'too long')
    expect(calls.setItem).toBe(1)
    expect(wrapper.read('k')).toBe('too long')
  })

  test('shrink levels are bounded', () => {
    const { storage } = fakeStorage({ maxLength: 0 })
    const wrapper = createResilientStorage({ getStorage: () => storage, log: jest.fn() })
    const shrink = jest.fn((level: number) => `v${level}`)
    wrapper.write('k', 'value', shrink)
    expect(shrink).toHaveBeenCalledTimes(3)
  })

  test('a blocked storage (it throws) is not used again: memory is the truth, logged once', () => {
    const { storage, state, calls } = fakeStorage()
    const log = jest.fn()
    const wrapper = createResilientStorage({ getStorage: () => storage, log })
    state.blocked = true
    wrapper.write('a', '1')
    wrapper.write('b', '2')
    expect(wrapper.read('a')).toBe('1')
    expect(wrapper.read('b')).toBe('2')
    expect(calls.setItem).toBe(1)
    expect(log).toHaveBeenCalledTimes(1)
    expect(log).toHaveBeenCalledWith(expect.stringMatching(/cannot be written/), expect.any(Error))
  })

  test('no storage at all keeps everything in memory and says so once', () => {
    const log = jest.fn()
    const wrapper = createResilientStorage({ getStorage: () => null, log })
    wrapper.write('k', 'v')
    wrapper.write('k2', 'v2')
    expect(wrapper.read('k')).toBe('v')
    expect(wrapper.keys('')).toEqual(['k', 'k2'])
    expect(log).toHaveBeenCalledTimes(1)
    expect(log).toHaveBeenCalledWith(expect.stringMatching(/storage is not available/), undefined)
  })

  test('remove reaches the storage even after a fall back to memory', () => {
    const { storage, data } = fakeStorage({ maxLength: 2 })
    const wrapper = createResilientStorage({ getStorage: () => storage, log: jest.fn() })
    data.set('k', 'old')
    wrapper.write('k', 'too long')
    wrapper.remove('k')
    expect(data.has('k')).toBe(false)
    expect(wrapper.read('k')).toBeNull()
  })

  test('keys lists the stored and the memory-only keys with a prefix', () => {
    const { storage, data } = fakeStorage({ maxLength: 4 })
    const wrapper = createResilientStorage({ getStorage: () => storage, log: jest.fn() })
    data.set('p.a', '1')
    data.set('other', '1')
    wrapper.write('p.b', 'too long for the storage')
    expect(wrapper.keys('p.').sort()).toEqual(['p.a', 'p.b'])
  })

  test('an error that is not a quota error is not retried with a smaller value', () => {
    const { storage, calls } = fakeStorage({ maxLength: 0, error: () => new Error('SecurityError') })
    const log = jest.fn()
    const wrapper = createResilientStorage({ getStorage: () => storage, log })
    const shrink = jest.fn(() => 'v')
    wrapper.write('k', 'value', shrink)
    expect(shrink).not.toHaveBeenCalled()
    expect(calls.setItem).toBe(1)
    expect(wrapper.read('k')).toBe('value')
  })
})
