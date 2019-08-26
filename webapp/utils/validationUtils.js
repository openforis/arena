import React from 'react'
import * as R from 'ramda'
import Markdown from 'react-remarkable'

import Validator from '../../common/validation/validator'
import ValidatorErrorKeys from '../../common/validation/validatorErrorKeys'

const getErrorText = (error, i18n) =>
  error.key === Validator.keys.customErrorMessageKey
    ? error.messages[i18n.lang]
    : i18n.t(error.key, error.params)

const getFieldError = i18n => field => R.pipe(
  R.pathOr([], [field, Validator.keys.errors]),
  R.map(error => getErrorText(error, i18n)),
  R.ifElse(
    R.isEmpty,
    () => getErrorText({
      key: ValidatorErrorKeys.invalidField, //default error message
      params: { field }
    }, i18n),
    R.join(', ')
  )
)

export const getValidationFieldMessages = (i18n, showKeys = true) =>
  validation => {
    const validationFields = Validator.getInvalidFieldValidations(validation)

    return R.pipe(
      R.keys,
      R.map(field => `${showKeys ? `${i18n.t(field)}: ` : ''}${getFieldError(i18n)(field)(validationFields)}`)
    )(validationFields)
  }

export const getValidationFieldMessagesHTML = (i18n, showKeys = true) =>
  validation =>
    R.pipe(
      getValidationFieldMessages(i18n, showKeys),

      messages => R.pipe(
        R.map(error => getErrorText(error, i18n)),
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