import React from 'react'
import * as R from 'ramda'
import Markdown from 'react-remarkable'

import Validation from '../../common/validation/validation'

const getErrorText = i18n => error =>
  error.key === Validation.keys.customErrorMessageKey
    ? error.messages[i18n.lang]
    : i18n.t(error.key, error.params)

const getValidationErrorMessages = i18n => R.pipe(
  Validation.getErrors,
  R.map(getErrorText(i18n)),
)

const getValidationFieldErrorMessage = (i18n, field) => R.pipe(
  getValidationErrorMessages(i18n),
  R.ifElse(
    R.isEmpty,
    () => getErrorText(i18n)({
      key: Validation.messageKeys.invalidField, //default error message
      params: { field }
    }),
    R.join(', ')
  )
)

export const getValidationFieldMessages = (i18n, showKeys = true) => validation => R.pipe(
  // extract invalid fields error messages
  Validation.getFieldValidations,
  Object.entries,
  R.map(([field, fieldValidation]) => `${showKeys ? `${i18n.t(field)}: ` : ''}${getValidationFieldErrorMessage(i18n, field)(fieldValidation)}`),
  // prepend validation error messages
  messages => R.pipe(
    getValidationErrorMessages(i18n),
    R.concat(messages)
  )(validation)
)(validation)

export const getValidationFieldMessagesHTML = (i18n, showKeys = true) =>
  validation =>
    R.pipe(
      getValidationFieldMessages(i18n, showKeys),
      R.addIndex(R.map)(
        (msg, i) =>
          <div key={i}>
            <Markdown>
              {msg}
            </Markdown>
          </div>
      )
    )(validation)