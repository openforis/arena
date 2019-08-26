import React from 'react'
import * as R from 'ramda'
import Markdown from 'react-remarkable'

import Validator from '../../common/validation/validator'
import ValidatorErrorKeys from '../../common/validation/validatorErrorKeys'

const getErrorText = (error, i18n, errorKeyPrefix = null) => {
  const errorKey = error.key

  if (errorKey === Validator.keys.customErrorMessageKey) {
    return error.messages[i18n.lang]
  } else {
    const messageKeys = errorKeyPrefix
      ? [`${errorKeyPrefix}.${errorKey}`, errorKey]
      : [errorKey]
    return i18n.t(messageKeys, error.params)
  }
}

const getFieldError = (i18n, errorKeyPrefix = null) => field => R.pipe(
  R.pathOr([], [field, Validator.keys.errors]),
  R.map(error => getErrorText(error, i18n, errorKeyPrefix)),
  R.ifElse(
    R.isEmpty,
    () => getErrorText({
      key: ValidatorErrorKeys.invalidField, //default error message
      params: { field }
    }, i18n),
    R.join(', ')
  )
)

export const getValidationFieldMessages = (i18n, errorKeyPrefix = null, showKeys = true) =>
  validation => {
    const validationFields = Validator.getInvalidFieldValidations(validation)

    return R.pipe(
      R.keys,
      R.map(field => `${showKeys ? `${i18n.t(field)}: ` : ''}${getFieldError(i18n, errorKeyPrefix)(field)(validationFields)}`)
    )(validationFields)
  }

export const getValidationFieldMessagesHTML = (i18n, errorKeyPrefix = null, showKeys = true) =>
  validation =>
    R.pipe(
      getValidationFieldMessages(i18n, errorKeyPrefix, showKeys),

      messages => R.pipe(
        R.map(error => getErrorText(error, i18n, errorKeyPrefix)),
        R.concat(messages)
      )(Validator.getErrors(validation)),

      R.addIndex(R.map)(
        (msg, i) =>
          <div key={i}>
            <Markdown>
              {msg}
            </Markdown>
          </div>
      )
    )(validation)