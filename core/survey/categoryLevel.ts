import type { ArenaCategoryItem, ArenaCategoryLevel } from '@openforis/arena-core'

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
export const getIndex = (level: ArenaCategoryLevel): number => A.prop(keys.index)(level)
export const getName: (level: ArenaCategoryLevel) => string | null = ObjectUtils.getProp(keysProps.name)
// also used with category items loaded as ref data (they include the category uuid)
export const getCategoryUuid = (level: ArenaCategoryLevel | ArenaCategoryItem): string =>
  A.prop(keys.categoryUuid)(level)
export const getItemsCount = (level: ArenaCategoryLevel): number | undefined => A.prop(keys.itemsCount)(level)

// UPDATE
export const assocProp = ({ key, value }: { key: string; value: unknown }) => ObjectUtils.setProp(key, value)
export const assocCategoryUuid =
  (categoryUuid: string) =>
  (level: ArenaCategoryLevel): ArenaCategoryLevel =>
    A.assoc(keys.categoryUuid, categoryUuid)(level)
