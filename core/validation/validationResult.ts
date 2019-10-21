import * as R from 'ramda';

const keys = {
  key: 'key',
  params: 'params',
  severity: 'severity',
  messages: 'messages',

  customErrorMessageKey: 'custom',
}

const severities = {
  error: 'error',
  warning: 'warning',
}

const newInstance = (key, params = null, severity = null, messages = null) => ({
  [keys.key]: key,
  ...((params ? { [keys.params]: params } : {})),
  ...((severity ? { [keys.severity]: severity } : {})),
  ...((messages ? { [keys.messages]: messages } : {})),
})

const getKey = R.prop(keys.key)
const getParams = R.propOr({}, keys.params)
const getSeverity = R.propOr(severities.error, keys.severity)

// custom messages
const getMessages = R.propOr({}, keys.messages)
const getMessage = lang => R.pipe(
  getMessages,
  R.ifElse(
    R.has(lang),
    R.prop(lang),
    //default to first message
    R.pipe(
      R.values,
      R.head
    )
  )
)
const hasMessages = R.pipe(getMessages, R.isEmpty, R.not)

export default {
  keys,

  severities,

  newInstance,

  getKey,
  getParams,
  getSeverity,
  getMessages,
  getMessage,
  isError: R.pipe(getSeverity, R.equals(severities.error)),
  hasMessages,
};
