import * as A from '../../../core/arena'
import { mergeProps } from './mergeProps'

const _assocPublishedDraft = (row) => ({
  ...row,
  published: !A.isEmpty(row.props),
  draft: !A.isEmpty(row.props_draft),
})

export const transformCallback = (row, draft = false, assocPublishedDraft = false, backup = false) => {
  if (A.isNull(row)) {
    return null
  }

  const rowUpdated = A.pipe(
    // Assoc published and draft properties based on props
    (rowCurrent) => (assocPublishedDraft ? _assocPublishedDraft(rowCurrent) : rowCurrent),
    A.camelizePartial({ skip: ['validation', 'props', 'props_draft'] })
  )(row)

  if (!backup) {
    return mergeProps({ draft })(rowUpdated)
  }

  // backup
  // camelize props_draft column into propsDraft
  rowUpdated.propsDraft = row.props_draft
  delete rowUpdated.props_draft
  return rowUpdated
}
