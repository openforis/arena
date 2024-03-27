import * as R from 'ramda'

import * as ActivityLog from '@common/activityLog/activityLog'

import * as A from '@core/arena'
import * as Category from '@core/survey/category'
import * as Survey from '@core/survey/survey'

// ===== SURVEY

export const getNodeDef = (survey) =>
  R.pipe(ActivityLog.getContentUuid, (nodeDefUuid) => Survey.getNodeDefByUuid(nodeDefUuid)(survey))

// ===== CATEGORY

export const getItemCategory = ActivityLog.getCategory

export const isItemCategoryDeleted = () => R.pipe(ActivityLog.getCategory, R.isNil)

export const isCategoryDeleted = isItemCategoryDeleted

// ==== CATEGORY, LEVELS

export const isLevelDeleted = ({ category, levelUuid }) =>
  A.isEmpty(category) || !Category.getLevelByUuid(levelUuid)(category)

// ===== TAXONOMY

export const { getTaxonomy } = ActivityLog

export const isTaxonomyDeleted = () => A.pipe(ActivityLog.getTaxonomy, R.isNil)
