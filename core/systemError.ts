export const StatusCodes = {
  CONTINUE: 100,

  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,

  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,

  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const

export default class SystemError extends Error {
  private readonly _key: string
  private readonly _params: any
  private readonly _statusCode: number

  constructor(key: string, params?: any, statusCode = StatusCodes.INTERNAL_SERVER_ERROR) {
    super(key)

    this.name = 'SystemError'

    this._key = key
    this._params = params
    this._statusCode = statusCode

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SystemError)
    }
  }

  get key(): string {
    return this._key
  }

  get params(): any {
    return this._params
  }

  get statusCode(): number {
    return this._statusCode
  }

  toJSON(): { key: string; params: any; statusCode: number } {
    const { key, params, statusCode } = this
    return { key, params, statusCode }
  }
}
