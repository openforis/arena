import * as R from 'ramda'

import * as ActivityLog from '@common/activityLog/activityLog'
import * as Survey from '@core/survey/survey'

// ===== SURVEY

export const getNodeDef = (survey) =>
  R.pipe(ActivityLog.getContentUuid, (nodeDefUuid) => Survey.getNodeDefByUuid(nodeDefUuid)(survey))

// ===== CATEGORY

export const isCategoryDeleted = (survey) =>
  R.pipe(ActivityLog.getContentUuid, (categoryUuid) => Survey.getCategoryByUuid(categoryUuid)(survey), R.isNil)

export const getItemCategory = (survey) => (activityLog) =>
  R.pipe(ActivityLog.getContentCategoryUuid, (categoryUuid) => Survey.getCategoryByUuid(categoryUuid)(survey))(
    activityLog
  )

export const isItemCategoryDeleted = (survey) => R.pipe(getItemCategory(survey), R.isNil)

// ===== TAXONOMY

export const getTaxonomy = (survey) =>
  R.pipe(ActivityLog.getContentUuid, (taxonomyUuid) => Survey.getTaxonomyByUuid(taxonomyUuid)(survey))

export const isTaxonomyDeleted = (survey) => R.pipe(getTaxonomy(survey), R.isNil)
