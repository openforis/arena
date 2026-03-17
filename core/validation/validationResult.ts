import * as R from 'ramda'

export const keys = {
  key: 'key',
  params: 'params',
  severity: 'severity',
  messages: 'messages',

  customErrorMessageKey: 'custom',
} as const

export const severity = {
  error: 'error',
  warning: 'warning',
} as const

export type Severity = (typeof severity)[keyof typeof severity]

export interface ValidationResultInstance {
  key: string
  params?: Record<string, unknown>
  severity?: Severity
  messages?: Record<string, string>
}

export const newInstance = (
  key: string,
  params: Record<string, unknown> | null = null,
  sev: Severity | null = null,
  messages: Record<string, string> | null = null
): ValidationResultInstance => ({
  [keys.key]: key,
  ...(params ? { [keys.params]: params } : {}),
  ...(sev ? { [keys.severity]: sev } : {}),
  ...(messages ? { [keys.messages]: messages } : {}),
})

export const getKey = R.prop(keys.key) as (v: ValidationResultInstance) => string
export const getParams = R.propOr({}, keys.params) as (v: ValidationResultInstance) => Record<string, unknown>
export const getSeverity = R.propOr(severity.error, keys.severity) as (v: ValidationResultInstance) => Severity

// Custom messages
export const getMessages = R.propOr({}, keys.messages) as (v: ValidationResultInstance) => Record<string, string>
export const getMessage =
  (lang: string) =>
  (validationResult: ValidationResultInstance): string => {
    const messages = getMessages(validationResult)
    if (lang in messages) {
      return messages[lang]
    }
    // Default to first message
    return Object.values(messages)[0]
  }
export const hasMessages = R.pipe(getMessages, R.isEmpty, R.not) as (v: ValidationResultInstance) => boolean

export const isError = R.pipe(getSeverity, R.equals(severity.error)) as (v: ValidationResultInstance) => boolean
