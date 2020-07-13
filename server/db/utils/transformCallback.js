import * as R from 'ramda'
import * as camelize from 'camelize'

import * as Validation from '../../../core/validation/validation'

const _mergeProps = (row, draft) => {
  const { props, propsDraft, ...rest } = row
  const propsUpdate = draft ? { ...props, ...propsDraft } : props
  return { ...rest, props: propsUpdate }
}

const _assocPublishedDraft = (row) => ({
  ...row,
  published: !R.isEmpty(row.props),
  draft: !R.isEmpty(row.props_draft),
})

export const transformCallback = (row, draft = false, assocPublishedDraft = false) => {
  if (R.isNil(row)) {
    return null
  }

  const validation = R.ifElse(Validation.hasValidation, Validation.getValidation, R.always(null))(row)

  return R.pipe(
    // Assoc published and draft properties based on props
    (rowCurrent) => (assocPublishedDraft ? _assocPublishedDraft(rowCurrent) : rowCurrent),
    // Dissoc validation before camelize (if any)
    R.unless(R.always(R.isNil(validation)), Validation.dissocValidation),
    camelize.default,
    (rowCurrent) => _mergeProps(rowCurrent, draft),
    // Assoc validation (if any)
    R.unless(R.always(R.isNil(validation)), Validation.assocValidation(validation))
  )(row)
}
