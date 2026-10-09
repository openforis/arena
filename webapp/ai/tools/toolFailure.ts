/**
 * Error a tool throws for a problem the model should read and fix (unknown name, invalid proposal…). The wrapper
 * turns it into `{ error: { code, message, ...details } }`.
 */
export class AiToolFailure extends Error {
  code: string

  details: Record<string, unknown>

  /**
   * Creates the failure.
   * @param {string} code - Machine-readable code (e.g. "nodeDefNotFound").
   * @param {string} message - Message for the model (English).
   * @param {object} [details] - Extra fields merged into the error result.
   */
  constructor(code: string, message: string, details: Record<string, unknown> = {}) {
    super(message)
    this.name = 'AiToolFailure'
    this.code = code
    this.details = details
  }
}
