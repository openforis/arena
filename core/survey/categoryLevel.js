import * as A from '@core/arena'

import * as ObjectUtils from '@core/objectUtils'

export const keys = {
  uuid: ObjectUtils.keys.uuid,
  categoryUuid: 'categoryUuid',
  index: ObjectUtils.keys.index,
  items: 'items',
  props: ObjectUtils.keys.props,
  published: ObjectUtils.keys.published,
  // not stored in db
  itemsCount: 'itemsCount',
}

export const keysProps = {
  name: 'name',
}

// READ
export const { getProps, getPropsDraft, getPropsAndPropsDraft, getUuid, isPublished } = ObjectUtils
export const getIndex = A.prop(keys.index)
export const getName = ObjectUtils.getProp(keysProps.name)
export const getCategoryUuid = A.prop(keys.categoryUuid)
export const getItemsCount = A.prop(keys.itemsCount)

// UPDATE
export const assocProp = ({ key, value }) => ObjectUtils.setProp(key, value)
export const assocCategoryUuid = (categoryUuid) => A.assoc(keys.categoryUuid, categoryUuid)
