import * as A from '@core/arena'

import * as ActivityLog from '@common/activityLog/activityLog'
import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'

// ===== SURVEY

export const getNodeDef = (survey) =>
  A.pipe(ActivityLog.getContentUuid, (nodeDefUuid) => Survey.getNodeDefByUuid(nodeDefUuid)(survey))

// ===== CATEGORY

export const getItemCategory = ActivityLog.getCategory

export const isItemCategoryDeleted = () => A.pipe(ActivityLog.getCategory, A.isNil)

export const isCategoryDeleted = isItemCategoryDeleted

// ==== CATEGORY, LEVELS

export const isLevelDeleted = ({ category, levelUuid }) =>
  A.isEmpty(category) || !Category.getLevelByUuid(levelUuid)(category)

// ===== TAXONOMY

export const { getTaxonomy } = ActivityLog

export const isTaxonomyDeleted = () => A.pipe(ActivityLog.getTaxonomy, A.isNil)
