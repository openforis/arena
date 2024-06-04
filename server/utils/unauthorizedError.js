import SystemError from '@core/systemError'

export default class UnauthorizedError extends SystemError {
  constructor(userName) {
    super('appErrors:userNotAuthorized', { userName })

    this.name = 'UnauthorizedError'
  }
}
