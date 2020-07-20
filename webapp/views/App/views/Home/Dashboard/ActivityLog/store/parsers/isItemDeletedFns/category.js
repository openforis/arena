import * as A from '@core/arena'

import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as CategoryItem from '@core/survey/categoryItem'

import * as ActivityLog from '@common/activityLog/activityLog'

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

    return A.isEmpty(category) || !Category.getLevelByUuid(levelUuid)(category)
  },

  [ActivityLog.type.categoryLevelPropUpdate]: () => (activityLog) => {
    const category = ActivityLogMessageParserUtils.getItemCategory(activityLog)
    const levelUuid = ActivityLog.getContentUuid(activityLog)

    return A.isEmpty(category) || !Category.getLevelByUuid(levelUuid)(category)
  },

  [ActivityLog.type.categoryLevelDelete]: () => ActivityLogMessageParserUtils.isItemCategoryDeleted,

  // ===== CATEGORY ITEM

  [ActivityLog.type.categoryItemInsert]: () => (activityLog) => {
    const category = ActivityLogMessageParserUtils.getItemCategory(activityLog)
    const itemInserted = ActivityLog.getContent(activityLog)
    const levelUuid = CategoryItem.getLevelUuid(itemInserted)

    return A.isEmpty(category) || !Category.getLevelByUuid(levelUuid)(category)
  },

  [ActivityLog.type.categoryItemPropUpdate]: () => (activityLog) => {
    const category = ActivityLogMessageParserUtils.getItemCategory(activityLog)
    const levelUuid = ActivityLog.getContentLevelUuid(activityLog)

    return A.isEmpty(category) || !Category.getLevelByUuid(levelUuid)(category)
  },

  [ActivityLog.type.categoryItemDelete]: () => ActivityLogMessageParserUtils.isItemCategoryDeleted,
}
