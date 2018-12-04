import * as R from 'ramda'
import React from 'react'

const getFieldError = (field) => R.pipe(
  R.pathOr([], [field, 'errors']),
  R.join(', ')
)

export const getValidationFieldMessagesHTML = error => R.pipe(
  R.keys,
  R.filter(key => R.pathEq([key, 'valid'], false, error)),
  R.addIndex(R.map)(
    (field, i) =>
      <div key={i}>
        {`${field} : ${getFieldError(field)(error)}`}
      </div>
  )
)(error)