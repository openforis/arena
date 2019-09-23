const R = require('ramda')

const keys = {
  key: 'key',
  params: 'params',
  severity: 'severity',
  messages: 'messages',
}

const severities = {
  error: 'error',
  warning: 'warning',
}

const newInstance = (key, params = null, severity = null, messages = null) => ({
  [keys.key]: key,
  ...params ? { [keys.params]: params } : {},
  ...severity ? { [keys.severity]: severity } : {},
  ...messages ? { [keys.messages]: messages } : {},
})

const getKey = R.prop(keys.key)
const getParams = R.propOr({}, keys.params)
const getSeverity = R.propOr(severities.error, keys.severity)

module.exports = {
  keys,

  severities,

  newInstance,

  getKey,
  getParams,
  getSeverity,
  isError: R.pipe(getSeverity, R.equals(severities.error))
}