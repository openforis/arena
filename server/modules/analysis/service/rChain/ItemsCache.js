import { Arrays } from '@openforis/arena-core'

export class ItemsCache {
  constructor({ maxItems = 1000, maxTotalItemsSize = null } = {}) {
    this._maxItems = maxItems
    this._maxTotalItemsSize = maxTotalItemsSize
    this._itemsByKey = {}
    this._itemsSizeByKey = {}
    this._lastAccessedKeys = []
  }

  add(key, item, itemSize = null) {
    this._itemsByKey[key] = item
    if (itemSize) {
      this._itemsSizeByKey[key] = itemSize
    }
    // keep specified key on top of the list
    this._updateLastAccessedKey(key)

    this._keepLimits()
  }

  _keepLimits() {
    while (
      this._lastAccessedKeys.length > 1 && // keep at least one item
      (this._lastAccessedKeys.length > this._maxItems || // max items exceeded
        (this._maxTotalItemsSize && this.getTotalItemsSize() > this._maxTotalItemsSize)) // max items size exceeded
    ) {
      // remove oldest accessed item from the cache
      const keyToRemove = this._lastAccessedKeys.pop()
      this._removeItem(keyToRemove)
    }
  }

  _removeItem(key) {
    delete this._itemsByKey[key]
    delete this._itemsSizeByKey[key]
  }

  _updateLastAccessedKey(key) {
    this._lastAccessedKeys = Arrays.removeItem(key)(this._lastAccessedKeys)
    this._lastAccessedKeys.unshift(key)
  }

  has(key) {
    return !!this.get(key)
  }

  get(key) {
    const item = this._itemsByKey[key]
    this._updateLastAccessedKey(key)
    return item
  }

  getTotalItemsSize() {
    return Object.values(this._itemsSizeByKey).reduce((acc, size) => acc + size, 0)
  }

  getItemSize(key) {
    return this._itemsSizeByKey[key]
  }
}
