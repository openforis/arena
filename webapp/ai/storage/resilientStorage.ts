/**
 * The one localStorage wrapper of the AI stores (suggestions, open conversations). When the storage is blocked, the
 * values live in memory for the session. A full storage is not a blocked one: the caller may shrink the value and
 * retry, and only when that fails the value stays in memory until a later write succeeds.
 */
import { logAiWarning } from '@webapp/ai/log/aiLog'

export type ResilientStorageBackend = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> &
  Partial<Pick<Storage, 'key' | 'length'>>

export type ResilientStorage = {
  read: (key: string) => string | null
  // shrink(level) returns a smaller value for a full storage (level 1, 2, ...), or null when there is nothing left to cut
  write: (key: string, value: string, shrink?: (level: number) => string | null) => void
  remove: (key: string) => void
  // the keys with a prefix, in the storage and in memory
  keys: (prefix: string) => string[]
}

// shrink levels tried before the value stays in memory only
const MAX_SHRINK_LEVELS = 3

/**
 * Returns true for the error of a full storage (the name differs between browsers).
 * @param {unknown} error - Thrown value.
 * @returns {boolean} True for a quota error.
 */
export const isQuotaExceededError = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) return false
  const { name, code, message } = error as { name?: unknown; code?: unknown; message?: unknown }
  return (
    name === 'QuotaExceededError' ||
    name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    code === 22 ||
    code === 1014 ||
    (typeof message === 'string' && /quota/i.test(message))
  )
}

/**
 * Returns the browser's localStorage, or null when it is not accessible.
 * @returns {ResilientStorageBackend|null} The storage.
 */
export const getBrowserLocalStorage = (): ResilientStorageBackend | null => {
  try {
    return globalThis.localStorage ?? null
  } catch {
    // accessing the property throws when storage is blocked
    return null
  }
}

/**
 * Creates the wrapper of a storage.
 * @param {object} params - Parameters.
 * @param {Function} params.getStorage - Returns the storage, or null when there is none (may throw when blocked).
 * @param {Function} [params.log] - Reports what the wrapper recovered from.
 * @returns {ResilientStorage} The wrapper.
 */
export const createResilientStorage = ({
  getStorage,
  log = logAiWarning,
}: {
  getStorage: () => ResilientStorageBackend | null
  log?: (message: string, error?: unknown) => void
}): ResilientStorage => {
  const memory = new Map<string, string>()
  // keys whose latest value is only in memory (the storage failed): reads must not return the older stored value
  const memoryOnly = new Set<string>()
  // the storage cannot be used at all (blocked, or none): memory is the truth for every key
  let blocked = false

  /**
   * Marks the storage as unusable for the session.
   * @param {string} reason - What happened.
   * @param {unknown} [error] - The error.
   * @returns {void}
   */
  const block = (reason: string, error?: unknown): void => {
    if (!blocked) log(`${reason}: the AI data of this session stays in memory`, error)
    blocked = true
  }

  /**
   * Stores a value, shrinking it while the storage is full.
   * @param {ResilientStorageBackend} storage - Storage.
   * @param {string} key - Key.
   * @param {string} value - Value.
   * @param {Function} [shrink] - Smaller values for a full storage.
   * @returns {string|null} The value that was stored, or null when none fit.
   */
  const store = (
    storage: ResilientStorageBackend,
    key: string,
    value: string,
    shrink?: (level: number) => string | null
  ): string | null => {
    let current: string | null = value
    for (let level = 0; current !== null && level <= MAX_SHRINK_LEVELS; level += 1) {
      try {
        storage.setItem(key, current)
        if (level > 0) log(`The browser storage is full: ${key} was pruned to fit (level ${level})`)
        return current
      } catch (error) {
        if (!isQuotaExceededError(error)) throw error
        current = shrink && level < MAX_SHRINK_LEVELS ? shrink(level + 1) : null
      }
    }
    log(`The browser storage is full: ${key} stays in memory for this session`)
    return null
  }

  return {
    read: (key) => {
      if (!blocked && !memoryOnly.has(key)) {
        try {
          const storage = getStorage()
          if (storage) return storage.getItem(key)
        } catch (error) {
          block('The browser storage cannot be read', error)
        }
      }
      return memory.get(key) ?? null
    },
    write: (key, value, shrink) => {
      memory.set(key, value)
      if (blocked) return
      try {
        const storage = getStorage()
        if (!storage) {
          block('The browser storage is not available')
          return
        }
        const stored = store(storage, key, value, shrink)
        if (stored === null) {
          memoryOnly.add(key)
          return
        }
        memory.set(key, stored)
        memoryOnly.delete(key)
      } catch (error) {
        block('The browser storage cannot be written', error)
      }
    },
    remove: (key) => {
      memory.delete(key)
      memoryOnly.delete(key)
      // also after a fallback to memory: an older value may still be stored and would come back on reload
      try {
        getStorage()?.removeItem(key)
      } catch (error) {
        block('The browser storage cannot be written', error)
      }
    },
    keys: (prefix) => {
      const found = new Set([...memory.keys()].filter((key) => key.startsWith(prefix)))
      try {
        const storage = getStorage()
        const count = storage?.length ?? 0
        for (let index = 0; storage?.key && index < count; index += 1) {
          const key = storage.key(index)
          if (key?.startsWith(prefix)) found.add(key)
        }
      } catch {
        // blocked: the keys in memory are all there is
      }
      return [...found]
    },
  }
}
