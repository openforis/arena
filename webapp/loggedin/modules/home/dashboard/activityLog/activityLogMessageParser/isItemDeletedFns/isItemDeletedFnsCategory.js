import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as CategoryItem from '@core/survey/categoryItem'

import * as ActivityLog from '@common/activityLog/activityLog'

import * as ActivityLogMessageParserUtils from '../activityLogMessageParserUtils'

export default {

  // ===== CATEGORY

  [ActivityLog.type.categoryInsert]: ActivityLogMessageParserUtils.isCategoryDeleted,

  [ActivityLog.type.categoryPropUpdate]: ActivityLogMessageParserUtils.isCategoryDeleted,

  // ===== CATEGORY LEVEL

  [ActivityLog.type.categoryLevelInsert]: survey => activityLog => {
    const categoryLevelInserted = ActivityLog.getContent(activityLog)
    const category = ActivityLogMessageParserUtils.getItemCategory(survey)(activityLog)
    const levelUuid = CategoryLevel.getUuid(categoryLevelInserted)

    return !category || !Category.getLevelByUuid(levelUuid)(category)
  },

  [ActivityLog.type.categoryLevelPropUpdate]: survey => activityLog => {
    const category = ActivityLogMessageParserUtils.getItemCategory(survey)(activityLog)
    const levelUuid = ActivityLog.getContentUuid(activityLog)

    return !category || !Category.getLevelByUuid(levelUuid)(category)
  },

  [ActivityLog.type.categoryLevelDelete]: ActivityLogMessageParserUtils.isItemCategoryDeleted,

  // ===== CATEGORY ITEM

  [ActivityLog.type.categoryItemInsert]: survey => activityLog => {
    const category = ActivityLogMessageParserUtils.getItemCategory(survey)(activityLog)
    const itemInserted = ActivityLog.getContent(activityLog)
    const levelUuid = CategoryItem.getLevelUuid(itemInserted)

    return !category || !Category.getLevelByUuid(levelUuid)(category)
  },

  [ActivityLog.type.categoryItemPropUpdate]: survey => activityLog => {
    const category = ActivityLogMessageParserUtils.getItemCategory(survey)(activityLog)
    const levelUuid = ActivityLog.getContentLevelUuid(activityLog)

    return !category || !Category.getLevelByUuid(levelUuid)(category)
  },

  [ActivityLog.type.categoryItemDelete]: ActivityLogMessageParserUtils.isItemCategoryDeleted,
}