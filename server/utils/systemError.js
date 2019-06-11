class SystemError extends Error {

  constructor ({ key, params }) {
    super(key)

    this.name = 'SystemError'

    this._key = key
    this._params = params

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SystemError)
    }
  }

  get key () {
    return this._key
  }

  get params () {
    return this._params
  }

}

module.exports = SystemError