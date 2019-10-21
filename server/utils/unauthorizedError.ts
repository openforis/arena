import SystemError from './systemError';

export default class UnauthorizedError extends SystemError {
	public name: any;

  constructor (userName?: string) {
    super('appErrors.userNotAuthorized', { userName })

    this.name = 'UnauthorizedError'
  }
}
