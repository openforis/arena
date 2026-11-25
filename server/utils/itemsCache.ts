// simple items cache
export default class ItemsCache<T = any, O extends object = Record<string, any>> {
  readonly options: O
  private readonly _itemsByKey: Record<string, T>

  constructor(options: O = {} as O) {
    this.options = options
    this._itemsByKey = {}
  }

  get(key: string): T | undefined {
    return this._itemsByKey[key]
  }

  has(key: string): boolean {
    return !!this.get(key)
  }

  get keys(): string[] {
    return Object.keys(this._itemsByKey)
  }

  get size(): number {
    return this.keys.length
  }

  isEmpty(): boolean {
    return this.size === 0
  }

  findKeys(filterFunction: (key: string) => boolean): string[] {
    return this.keys.filter((key) => filterFunction(key))
  }

  set(key: string, item: T): this {
    this._itemsByKey[key] = item
    return this
  }

  delete(key: string): this {
    delete this._itemsByKey[key]
    return this
  }
}
