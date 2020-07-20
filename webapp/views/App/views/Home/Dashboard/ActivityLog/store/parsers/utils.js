import * as R from 'ramda'
import * as A from '@core/arena'

import * as ActivityLog from '@common/activityLog/activityLog'
import * as Survey from '@core/survey/survey'

const mergePropsAndPropsDraft = (item) =>
  A.isEmpty(item) ? item : { ...item, props: { ...(item.props || {}), ...(item.propsDraft || {}) } }

// ===== SURVEY

export const getNodeDef = (survey) =>
  R.pipe(ActivityLog.getContentUuid, (nodeDefUuid) => Survey.getNodeDefByUuid(nodeDefUuid)(survey))

// ===== CATEGORY

export const getItemCategory = A.pipe(ActivityLog.getCategory, mergePropsAndPropsDraft)

export const isItemCategoryDeleted = () => R.pipe(ActivityLog.getCategory, R.isNil)

export const isCategoryDeleted = isItemCategoryDeleted

// ===== TAXONOMY

export const getTaxonomy = A.pipe(ActivityLog.getTaxonomy, mergePropsAndPropsDraft)

export const isTaxonomyDeleted = () => A.pipe(ActivityLog.getTaxonomy, R.isNil)
