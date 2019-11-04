import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as CategoryItem from '@core/survey/categoryItem'

import * as ActivityLog from '@common/activityLog/activityLog'

import * as ActivityLogMessageParserUtils from '../activityLogMessageParserUtils'

export default {

  // ===== CATEGORY

  [ActivityLog.type.categoryPropUpdate]: survey => R.pipe(
    ActivityLog.getContentUuid,
    categoryUuid => Survey.getCategoryByUuid(categoryUuid)(survey),
    R.isNil
  ),

  // ===== CATEGORY LEVEL

  [ActivityLog.type.categoryLevelInsert]: survey => activityLog => {
    const categoryLevelInserted = ActivityLog.getContent(activityLog)
    const category = ActivityLogMessageParserUtils.getCategory(survey)(activityLog)
    const levelUuid = CategoryLevel.getUuid(categoryLevelInserted)

    return !category || !Category.getLevelByUuid(levelUuid)(category)
  },

  [ActivityLog.type.categoryLevelPropUpdate]: survey => activityLog => {
    const category = ActivityLogMessageParserUtils.getCategory(survey)(activityLog)
    const levelUuid = ActivityLog.getContentUuid(activityLog)

    return !category || !Category.getLevelByUuid(levelUuid)(category)
  },

  [ActivityLog.type.categoryLevelDelete]: ActivityLogMessageParserUtils.isCategoryDeleted,

  // ===== CATEGORY ITEM

  [ActivityLog.type.categoryItemInsert]: survey => activityLog => {
    const category = ActivityLogMessageParserUtils.getCategory(survey)(activityLog)
    const itemInserted = ActivityLog.getContent(activityLog)
    const levelUuid = CategoryItem.getLevelUuid(itemInserted)

    return !category || !Category.getLevelByUuid(levelUuid)(category)
  },

  [ActivityLog.type.categoryItemPropUpdate]: survey => activityLog => {
    const category = ActivityLogMessageParserUtils.getCategory(survey)(activityLog)
    const levelUuid = ActivityLog.getContentLevelUuid(activityLog)

    return !category || !Category.getLevelByUuid(levelUuid)(category)
  },

  [ActivityLog.type.categoryItemDelete]: ActivityLogMessageParserUtils.isCategoryDeleted,
}