import ItemsCache from './ItemsCache'

const defaultOptions = {
  deleteDelaySeconds: 30, // 30 seconds
}

/**
 * Simple items cache with delayed delete.
 * When an item is deleted, a timeout is started and the delete will be delayed
 * by the specified seconds.
 */
export default class DelayedDeleteCache extends ItemsCache {
  constructor(options = {}) {
    super({ ...defaultOptions, ...options })
    this._deleteTimeoutIdByKey = {}
  }

  set(key, item) {
    this._clearDeleteTimeout(key)
    return super.set(key, item)
  }

  delete(key) {
    this._resetDeleteTimeout(key)
    return this
  }

  _clearDeleteTimeout(key) {
    const timeoutId = this._deleteTimeoutIdByKey[key]
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    delete this._deleteTimeoutIdByKey[key]
  }

  _resetDeleteTimeout(key) {
    this._clearDeleteTimeout(key)

    const timeoutId = setTimeout(() => {
      super.delete(key)
    }, this.options.deleteDelaySeconds * 1000)
    // delete timer must not keep the process alive (e.g. at the end of the tests)
    timeoutId.unref?.()
    this._deleteTimeoutIdByKey[key] = timeoutId
  }
}
