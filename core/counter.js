export default class Counter {
  constructor() {
    this._count = 0
  }

  get count() {
    return this._count
  }

  increment() {
    return ++this._count
  }

  decrement() {
    return --this._count
  }
}
