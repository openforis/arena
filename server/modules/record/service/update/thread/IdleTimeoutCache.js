const defaultOptions = {
  itemIdleTimeoutSeconds: 15 * 60, // 15 mins
}

/**
 * Simple items cache with idle timeout.
 * When the timeout for an item is reached,
 * the item is automatically removed from the cache to save memory.
 */
export default class IdleTimeoutCache {
  constructor(options = {}) {
    const { itemIdleTimeoutSeconds } = { ...defaultOptions, ...options }

    this.itemIdleTimeoutSeconds = itemIdleTimeoutSeconds
    this._itemsByKey = {}
    this._itemTimeoutIdByKey = {}
  }

  get(key) {
    this._resetItemIdleTimeout(key)
    return this._itemsByKey[key]
  }

  has(key) {
    return !!this.get(key)
  }

  get keys() {
    return Object.keys(this._itemsByKey)
  }

  get size() {
    return this.keys.length
  }

  isEmpty() {
    return this.size === 0
  }

  findKeys(filterFunction) {
    return this.keys.filter(filterFunction)
  }

  set(key, item) {
    this._itemsByKey[key] = item
    this._resetItemIdleTimeout(key)
    return this
  }

  delete(key) {
    this._clearItemIdleTimeout(key)
    delete this._itemsByKey[key]
    return this
  }

  _clearItemIdleTimeout(key) {
    const timeoutId = this._itemTimeoutIdByKey[key]
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    delete this._itemTimeoutIdByKey[key]
  }

  _resetItemIdleTimeout(key) {
    this._clearItemIdleTimeout(key)

    this._itemTimeoutIdByKey[key] = setTimeout(() => {
      this.delete(key)
    }, this.itemIdleTimeoutSeconds * 1000)
  }
}
