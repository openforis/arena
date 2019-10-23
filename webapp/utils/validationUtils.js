import React from 'react'
import * as R from 'ramda'

import Validation from '../../core/validation/validation'
import ValidationResult from '../../core/validation/validationResult'
import Markdown from './markdown'

const getErrorText = i18n => error =>
  ValidationResult.hasMessages(error)
    ? ValidationResult.getMessage(i18n.lang)(error)
    : i18n.t(ValidationResult.getKey(error), ValidationResult.getParams(error))

const getValidationErrorMessages = i18n => validation => R.pipe(
  Validation.getErrors,
  R.concat(Validation.getWarnings(validation)),
  R.map(getErrorText(i18n)),
)(validation)

const getValidationFieldErrorMessage = (i18n, field) => R.pipe(
  getValidationErrorMessages(i18n),
  R.ifElse(
    R.isEmpty,
    () => getErrorText(i18n)(
      ValidationResult.newInstance(
        Validation.messageKeys.invalidField, //default error message
        { field }
      )
    ),
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
        (msg, i) => <Markdown key={i} source={msg} options={{html: true}} />
      )
    )(validation)
