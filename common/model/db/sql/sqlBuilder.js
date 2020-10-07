class SqlBuilder {
  constructor() {
    if (new.target === SqlBuilder) {
      throw new TypeError('Cannot construct SqlBuilder instance directly')
    }
    this._params = {}
  }

  get params() {
    return { ...this._params }
  }

  addParams(params) {
    Object.assign(this._params, params)
    return this
  }

  // eslint-disable-next-line class-methods-use-this
  build() {
    throw new Error('build is not implemented')
  }
}

export default SqlBuilder
