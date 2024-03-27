import * as ActivityLog from '@common/activityLog/activityLog'

import * as CategoryItem from '@core/survey/categoryItem'
import * as CategoryLevel from '@core/survey/categoryLevel'

import * as ActivityLogMessageParserUtils from '../utils'

export default {
  // ===== CATEGORY

  [ActivityLog.type.categoryInsert]: () => ActivityLogMessageParserUtils.isCategoryDeleted,

  [ActivityLog.type.categoryPropUpdate]: () => ActivityLogMessageParserUtils.isCategoryDeleted,

  // ===== CATEGORY LEVEL

  [ActivityLog.type.categoryLevelInsert]: () => (activityLog) => {
    const categoryLevelInserted = ActivityLog.getContent(activityLog)
    const category = ActivityLogMessageParserUtils.getItemCategory(activityLog)
    const levelUuid = CategoryLevel.getUuid(categoryLevelInserted)

    return ActivityLogMessageParserUtils.isLevelDeleted({ category, levelUuid })
  },

  [ActivityLog.type.categoryLevelPropUpdate]: () => (activityLog) => {
    const category = ActivityLogMessageParserUtils.getItemCategory(activityLog)
    const levelUuid = ActivityLog.getContentUuid(activityLog)

    return ActivityLogMessageParserUtils.isLevelDeleted({ category, levelUuid })
  },

  [ActivityLog.type.categoryLevelDelete]: () => ActivityLogMessageParserUtils.isItemCategoryDeleted,

  // ===== CATEGORY ITEM

  [ActivityLog.type.categoryItemInsert]: () => (activityLog) => {
    const category = ActivityLogMessageParserUtils.getItemCategory(activityLog)
    const itemInserted = ActivityLog.getContent(activityLog)
    const levelUuid = CategoryItem.getLevelUuid(itemInserted)

    return ActivityLogMessageParserUtils.isLevelDeleted({ category, levelUuid })
  },

  [ActivityLog.type.categoryItemPropUpdate]: () => (activityLog) => {
    const category = ActivityLogMessageParserUtils.getItemCategory(activityLog)
    const levelUuid = ActivityLog.getContentLevelUuid(activityLog)

    return ActivityLogMessageParserUtils.isLevelDeleted({ category, levelUuid })
  },

  [ActivityLog.type.categoryItemDelete]: () => ActivityLogMessageParserUtils.isItemCategoryDeleted,
}
