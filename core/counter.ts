export default class Counter {
  private _count = 0

  get count(): number {
    return this._count
  }

  increment(): number {
    this._count += 1
    return this._count
  }

  decrement(): number {
    this._count -= 1
    return this._count
  }
}
