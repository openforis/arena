import ItemsCache from './ItemsCache'

const defaultOptions = {
  itemIdleTimeoutSeconds: 15 * 60, // 15 mins
}

/**
 * Simple items cache with idle timeout.
 * When the timeout for an item is reached,
 * the item is automatically removed from the cache to save memory.
 */
type IdleTimeoutCacheOptions = { itemIdleTimeoutSeconds: number }

export default class IdleTimeoutCache<T = any> extends ItemsCache<T, IdleTimeoutCacheOptions> {
  private readonly _itemTimeoutIdByKey: Record<string, NodeJS.Timeout>

  constructor(options: Partial<IdleTimeoutCacheOptions> = {}) {
    super({ ...defaultOptions, ...options })
    this._itemTimeoutIdByKey = {}
  }

  get(key: string): T | undefined {
    this._resetItemIdleTimeout(key)
    return super.get(key)
  }

  set(key: string, item: T): this {
    this._resetItemIdleTimeout(key)
    return super.set(key, item)
  }

  delete(key: string): this {
    this._clearItemIdleTimeout(key)
    return super.delete(key)
  }

  _clearItemIdleTimeout(key: string): void {
    const timeoutId = this._itemTimeoutIdByKey[key]
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    delete this._itemTimeoutIdByKey[key]
  }

  _resetItemIdleTimeout(key: string): void {
    this._clearItemIdleTimeout(key)

    const timeoutId = setTimeout(() => {
      this.delete(key)
    }, this.options.itemIdleTimeoutSeconds * 1000)
    // eviction timer must not keep the process alive (e.g. at the end of the tests)
    timeoutId.unref?.()
    this._itemTimeoutIdByKey[key] = timeoutId
  }
}
