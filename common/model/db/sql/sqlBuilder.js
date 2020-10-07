class SqlBuilder {
  constructor() {
    if (new.target === SqlBuilder) {
      throw new TypeError('Cannot construct SqlBuilder instance directly')
    }
  }

  // eslint-disable-next-line class-methods-use-this
  build() {
    throw new Error('build is not implemented')
  }
}

export default SqlBuilder
