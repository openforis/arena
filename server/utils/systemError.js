class SystemError extends Error {

  constructor (messageKey, ...messageParams) {
    super(messageKey)

    this._messageKey = messageKey
    this._messageParams = messageParams

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SystemError)
    }
  }

  get messageKey () {
    return this._messageKey
  }

  get messageParams () {
    return this._messageParams
  }

}

module.exports = SystemError