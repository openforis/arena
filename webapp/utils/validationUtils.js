import * as R from 'ramda'
import React from 'react'

const getFieldError = i18n => field => R.pipe(
  R.pathOr([], [field, 'errors']),
  R.map(error => `${i18n.t(`formErrors.${error.key}`, error.params)}`),
  R.ifElse(
    R.isEmpty,
    () => 'invalid', //default error message
    R.join(', ')
  )
)

export const getValidationFieldMessages = i18n => validationFields => R.pipe(
  R.keys,
  R.filter(key => R.pathEq([key, 'valid'], false, validationFields)),
  R.map(field => `${field}: ${getFieldError(i18n)(field)(validationFields)}`)
)(validationFields)

export const getValidationFieldMessagesHTML = i18n => validationFields =>
  R.pipe(
    getValidationFieldMessages(i18n),
    messages => validationFields.errors
      ? R.pipe(
        R.map(error => `${i18n.t(`formErrors.${error.key}`, error.params)}`),
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