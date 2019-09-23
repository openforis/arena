const R = require('ramda')

const keys = {
  key: 'key',
  params: 'params',
  severity: 'severity',
  messages: 'messages',

  custom: 'custom',
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

const newInstanceCustom = (severity, messages) => newInstance(
  keys.custom,
  null,
  severity,
  messages
)

const getKey = R.prop(keys.key)
const getParams = R.propOr({}, keys.params)
const getSeverity = R.propOr(severities.error, keys.severity)

// custom messages
const hasCustomMessages = result => getKey(result) === keys.custom
const getMessages = R.propOr({}, keys.messages)
const getMessage = lang => R.pipe(
  getMessages,
  // default to first message
  messages => R.propOr(R.pipe(R.values, R.head), lang)(messages)
)

module.exports = {
  keys,

  severities,

  newInstance,
  newInstanceCustom,

  getKey,
  getParams,
  getSeverity,
  getMessages,
  getMessage,
  isError: R.pipe(getSeverity, R.equals(severities.error)),
  hasCustomMessages,
}