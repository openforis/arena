const SystemError = require('./systemError')

class UnauthorizedError extends SystemError {
  constructor (userName) {
    super('userNotAuthorized', userName)
  }
}

module.exports = UnauthorizedError