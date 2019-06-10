const SystemError = require('./systemError')

class UnauthorizedError extends SystemError {
  constructor (userName) {
    super({
      key: 'userNotAuthorized',
      params: { userName },
    }, `User ${userName} is not authorized`)
  }
}

module.exports = UnauthorizedError