import * as R from 'ramda'
import * as camelize from 'camelize'

import { mergeProps } from './mergeProps'

const _assocPublishedDraft = (row) => ({
  ...row,
  published: !R.isEmpty(row.props),
  draft: !R.isEmpty(row.props_draft),
})

const _camelize = ({ skippedProps = [] }) => (obj) =>
  Object.entries(obj).reduce((accObj, [propName, value]) => {
    const propNameCamelCase = camelize(propName)
    const valueTransformed = skippedProps.includes(propName) || !(value instanceof Object) ? value : camelize(value)
    return { ...accObj, [propNameCamelCase]: valueTransformed }
  }, {})

export const transformCallback = (row, draft = false, assocPublishedDraft = false) => {
  if (R.isNil(row)) {
    return null
  }

  return R.pipe(
    // Assoc published and draft properties based on props
    (rowCurrent) => (assocPublishedDraft ? _assocPublishedDraft(rowCurrent) : rowCurrent),
    _camelize({ skippedProps: ['validation', 'props', 'props_draft'] }),
    mergeProps({ draft })
  )(row)
}
