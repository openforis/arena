const SystemError = require('@core/systemError')

class UnauthorizedError extends SystemError {
  constructor (userName) {
    super('appErrors.userNotAuthorized', { userName })

    this.name = 'UnauthorizedError'
  }
}

module.exports = UnauthorizedError