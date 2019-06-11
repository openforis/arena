const SystemError = require('./systemError')

class UnauthorizedError extends SystemError {
  constructor (userName) {
    super({ key: 'userNotAuthorized', params: { userName } })

    this.name = 'UnauthorizedError'
  }
}

module.exports = UnauthorizedError