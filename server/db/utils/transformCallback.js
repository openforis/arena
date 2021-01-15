import * as A from '../../../core/arena'
import { mergeProps } from './mergeProps'

const _assocPublishedDraft = (row) => ({
  ...row,
  published: !A.isEmpty(row.props),
  draft: !A.isEmpty(row.props_draft),
})

export const transformCallback = (row, draft = false, assocPublishedDraft = false) => {
  if (A.isNull(row)) {
    return null
  }

  return A.pipe(
    // Assoc published and draft properties based on props
    (rowCurrent) => (assocPublishedDraft ? _assocPublishedDraft(rowCurrent) : rowCurrent),
    A.camelizePartial({ skip: ['validation', 'props', 'props_draft'] }),
    mergeProps({ draft })
  )(row)
}
