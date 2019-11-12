export default class Counter {

  constructor () {
    this._count = 0
  }

  get count () {
    return this._count
  }

  increment () {
    this._count++
  }

  decrement () {
    this._count--
  }

}
