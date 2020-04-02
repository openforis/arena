import * as R from 'ramda'

export const keys = {
  key: 'key',
  params: 'params',
  severity: 'severity',
  messages: 'messages',

  customErrorMessageKey: 'custom',
}

export const severity = {
  error: 'error',
  warning: 'warning',
}

export const newInstance = (key, params = null, severity = null, messages = null) => ({
  [keys.key]: key,
  ...(params ? { [keys.params]: params } : {}),
  ...(severity ? { [keys.severity]: severity } : {}),
  ...(messages ? { [keys.messages]: messages } : {}),
})

export const getKey = R.prop(keys.key)
export const getParams = R.propOr({}, keys.params)
export const getSeverity = R.propOr(severity.error, keys.severity)

// Custom messages
export const getMessages = R.propOr({}, keys.messages)
export const getMessage = (lang) =>
  R.pipe(
    getMessages,
    R.ifElse(
      R.has(lang),
      R.prop(lang),
      // Default to first message
      R.pipe(R.values, R.head)
    )
  )
export const hasMessages = R.pipe(getMessages, R.isEmpty, R.not)

export const isError = R.pipe(getSeverity, R.equals(severity.error))
