import * as R from 'ramda'
import React from 'react'

const getFieldError = field => R.pipe(
  R.pathOr([], [field, 'errors']),
  R.ifElse(
    R.isEmpty,
    () => 'invalid', //default error message
    R.join(', ')
  )
)

export const getValidationFieldMessages = validationFields => R.pipe(
  R.keys,
  R.filter(key => R.pathEq([key, 'valid'], false, validationFields)),
  R.map(field => `${field} : ${getFieldError(field)(validationFields)}`)
)(validationFields)

export const getValidationFieldMessagesHTML = R.pipe(
  getValidationFieldMessages,
  R.addIndex(R.map)(
    (msg, i) =>
      <div key={i}>
        {msg}
      </div>
  )
)