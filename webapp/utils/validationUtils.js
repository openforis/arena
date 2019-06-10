import * as R from 'ramda'
import React from 'react'

import Validator from '../../common/validation/validator'

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
  validation => {
    const validationFields = Validator.getInvalidFieldValidations(validation)

    return R.pipe(
      R.keys,
      R.map(field => `${field}: ${getFieldError(i18n, errorKeyPrefix)(field)(validationFields)}`)
    )(validationFields)
  }
export const getValidationFieldMessagesHTML = (i18n, errorKeyPrefix = 'formErrors') =>
  validation =>
    R.pipe(
      getValidationFieldMessages(i18n, errorKeyPrefix),
      messages => validation.errors
        ? R.pipe(
          R.map(error => getErrorText(error, i18n, errorKeyPrefix)),
          R.concat(messages)
        )(validation.errors)
        : messages,
      R.addIndex(R.map)(
        (msg, i) =>
          <div key={i}>
            {msg}
          </div>
      )
    )(validation)