import * as R from 'ramda'

import * as ActivityLog from '@common/activityLog/activityLog'
import * as Survey from '@core/survey/survey'

// ===== SURVEY

export const getNodeDef = survey => R.pipe(
  ActivityLog.getContentUuid,
  nodeDefUuid => Survey.getNodeDefByUuid(nodeDefUuid)(survey)
)

// ===== CATEGORY

export const getCategory = survey => activityLog => R.pipe(
  ActivityLog.getContentCategoryUuid,
  categoryUuid => Survey.getCategoryByUuid(categoryUuid)(survey),
)(activityLog)

export const isCategoryDeleted = survey => R.pipe(
  getCategory(survey),
  R.isNil
)
