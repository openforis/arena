class SqlBuilder {
  protected _params: Record<string, unknown>

  constructor() {
    if (new.target === SqlBuilder) {
      throw new TypeError('Cannot construct SqlBuilder instance directly')
    }
    this._params = {}
  }

  get params(): Record<string, unknown> {
    return { ...this._params }
  }

  addParams(params: Record<string, unknown>): this {
    Object.assign(this._params, params)
    return this
  }

  build(): string {
    throw new Error('build is not implemented')
  }
}

export default SqlBuilder
