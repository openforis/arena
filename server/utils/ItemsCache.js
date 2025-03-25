/**
 * Simple items cache.
 */
export default class ItemsCache {
  constructor(options = {}) {
    this.options = options
    this._itemsByKey = {}
    this._itemTimeoutIdByKey = {}
  }

  get(key) {
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
    return this
  }

  delete(key) {
    delete this._itemsByKey[key]
    return this
  }
}
