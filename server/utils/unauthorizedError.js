const SystemError = require('./systemError')

class UnauthorizedError extends SystemError {
  constructor (userName) {
    super('userNotAuthorized', { userName })

    this.name = 'UnauthorizedError'
  }
}

module.exports = UnauthorizedError