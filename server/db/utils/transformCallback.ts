import * as A from '../../../core/arena'
import { mergeProps } from './mergeProps'

const _assocPublishedDraft = (row: Record<string, any>): Record<string, any> => {
  row.published = !A.isEmpty(row.props)
  row.draft = !A.isEmpty(row.props_draft)
  return row
}

export const transformCallback = (
  row: Record<string, any> | null,
  draft = false,
  assocPublishedDraft = false,
  backup = false
): any => {
  if (A.isNull(row)) {
    return null
  }
  // Assoc published and draft properties based on props
  if (backup || assocPublishedDraft) {
    _assocPublishedDraft(row)
  }
  A.camelizePartial({
    skip: ['validation', 'props', 'props_draft'],
    limitToLevel: 1,
    sideEffect: true,
  })(row)

  if (!backup) {
    return mergeProps({ draft })(row)
  }
  // backup
  // keep props_draft and camelize props_draft column into propsDraft
  row.propsDraft = row.props_draft
  delete row.props_draft

  return row
}
