import * as R from 'ramda'

import * as ObjectUtils from '@core/objectUtils'

export const keys = {
  uuid: ObjectUtils.keys.uuid,
  categoryUuid: 'categoryUuid',
  index: ObjectUtils.keys.index,
  items: 'items',
  props: ObjectUtils.keys.props,
  published: ObjectUtils.keys.published,
}

export const keysProps = {
  name: 'name',
}

// READ
export const { getProps, getPropsDraft, getUuid, isPublished } = ObjectUtils
export const getIndex = R.prop(keys.index)
export const getName = ObjectUtils.getProp(keysProps.name)
export const getCategoryUuid = R.prop(keys.categoryUuid)

// UPDATE
export const assocProp = ({ key, value }) => ObjectUtils.setProp(key, value)
export const assocCategoryUuid = (categoryUuid) => R.assoc(keys.categoryUuid, categoryUuid)
