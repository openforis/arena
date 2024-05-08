import ItemsCache from './ItemsCache'

const defaultOptions = {
  itemIdleTimeoutSeconds: 15 * 60, // 15 mins
}

/**
 * Simple items cache with idle timeout.
 * When the timeout for an item is reached,
 * the item is automatically removed from the cache to save memory.
 */
export default class IdleTimeoutCache extends ItemsCache {
  constructor(options = {}) {
    super({ ...defaultOptions, ...options })
    this._itemTimeoutIdByKey = {}
  }

  get(key) {
    this._resetItemIdleTimeout(key)
    return super.get(key)
  }

  set(key, item) {
    this._resetItemIdleTimeout(key)
    return super.set(key, item)
  }

  delete(key) {
    this._clearItemIdleTimeout(key)
    return super.delete(key)
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
    }, this.options.itemIdleTimeoutSeconds * 1000)
  }
}
