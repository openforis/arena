import * as R from 'ramda'
import React from 'react'

const getErrorText = (error, i18n, errorKeyPrefix) => i18n.t(`${errorKeyPrefix}.${error.key}`, error.params)

const getFieldError = (i18n, errorKeyPrefix) => field => R.pipe(
  R.pathOr([], [field, 'errors']),
  R.map(error => getErrorText(error, i18n, errorKeyPrefix)),
  R.ifElse(
    R.isEmpty,
    () => 'invalid', //default error message
    R.join(', ')
  )
)

export const getValidationFieldMessages = (i18n, errorKeyPrefix = 'formErrors') =>
  validationFields => R.pipe(
    R.keys,
    R.filter(key => R.pathEq([key, 'valid'], false, validationFields)),
    R.map(field => `${field}: ${getFieldError(i18n, errorKeyPrefix)(field)(validationFields)}`)
  )(validationFields)

export const getValidationFieldMessagesHTML = (i18n, errorKeyPrefix = 'formErrors') =>
  validationFields =>
    R.pipe(
      getValidationFieldMessages(i18n, errorKeyPrefix),
      messages => validationFields.errors
        ? R.pipe(
          R.map(error => getErrorText(error, i18n, errorKeyPrefix)),
          R.concat(messages)
        )(validationFields.errors)
        : messages,
      R.addIndex(R.map)(
        (msg, i) =>
          <div key={i}>
            {msg}
          </div>
      )
    )(validationFields)