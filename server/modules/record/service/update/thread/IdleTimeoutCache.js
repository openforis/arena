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
    this.itemsByKey = {}
    this._itemTimeoutByKey = {}
  }

  get(key) {
    this._resetItemIdleTimeout(key)
    return this.itemsByKey[key]
  }

  has(key) {
    return !!this.get(key)
  }

  get keys() {
    return Object.keys(this.itemsByKey)
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
    this.itemsByKey[key] = item
    this._resetItemIdleTimeout(key)
    return this
  }

  delete(key) {
    this._clearItemIdleTimeout(key)

    delete this.itemsByKey[key]
  }

  _clearItemIdleTimeout(key) {
    const oldTimeout = this._itemTimeoutByKey[key]
    if (oldTimeout) {
      clearTimeout(oldTimeout)
    }
    delete this._itemTimeoutByKey[key]
  }

  _resetItemIdleTimeout(key) {
    this._clearItemIdleTimeout(key)

    this._itemTimeoutByKey[key] = setTimeout(() => {
      this.delete(key)
    }, this.itemIdleTimeoutSeconds * 1000)
  }
}
