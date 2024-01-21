import { Arrays } from '@openforis/arena-core'

export class ItemsCache {
  constructor({ maxItems = 10 } = {}) {
    this._maxItems = maxItems
    this._itemsByKey = {}
    this._lastAccessedKeys = []
  }

  add(key, item) {
    this._itemsByKey[key] = item
    // keep specified key on top of the list
    this._updateLastAccessedKey(key)
    if (this._lastAccessedKeys.length > this._maxItems) {
      // remove oldest accessed item from the cache
      const keyToRemove = this._lastAccessedKeys.pop()
      delete this._itemsByKey[keyToRemove]
    }
  }

  _updateLastAccessedKey(key) {
    this._lastAccessedKeys = Arrays.removeItem(key)(this._lastAccessedKeys)
    this._lastAccessedKeys.unshift(key)
  }

  get(key) {
    const item = this._itemsByKey[key]
    this._updateLastAccessedKey(key)
    return item
  }
}
