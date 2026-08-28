import * as Request from './request'

// Throws if the named param is missing (or falsy) in the request's query, route params, or body.
export const checkRequired = (req: any, paramName: string): any => {
  const value = Request.getParams(req)[paramName]
  if (!value) {
    throw new Error(`${paramName} is required`)
  }
  return value
}

// Throws if the named param is missing, or present but not a valid integer.
export const checkRequiredInteger = (req: any, paramName: string): any => {
  const value = checkRequired(req, paramName)
  if (!Number.isInteger(Number(value))) {
    throw new Error(`${paramName} must be a valid integer`)
  }
  return value
}
