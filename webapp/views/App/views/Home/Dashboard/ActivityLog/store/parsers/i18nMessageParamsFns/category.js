import * as ActivityLog from '@common/activityLog/activityLog'

import * as Category from '@core/survey/category'
import * as CategoryItem from '@core/survey/categoryItem'
import * as CategoryLevel from '@core/survey/categoryLevel'

import * as ActivityLogMessageParserUtils from '../utils'

export default {
  // ===== CATEGORY

  [ActivityLog.type.categoryPropUpdate]: () => (activityLog) => {
    const category = ActivityLogMessageParserUtils.getItemCategory(activityLog)
    return {
      key: ActivityLog.getContentKey(activityLog),
      categoryName: Category.getName(category),
    }
  },

  [ActivityLog.type.categoryDelete]: () => (activityLog) => ({
    categoryName: ActivityLog.getContentCategoryName(activityLog),
  }),

  // ===== CATEGORY LEVEL

  [ActivityLog.type.categoryLevelInsert]: () => (activityLog) => {
    const categoryLevelInserted = ActivityLog.getContent(activityLog)
    const category = ActivityLogMessageParserUtils.getItemCategory(activityLog)

    return {
      index: CategoryLevel.getIndex(categoryLevelInserted),
      categoryName: Category.getName(category),
    }
  },

  [ActivityLog.type.categoryLevelPropUpdate]: () => (activityLog) => {
    const category = ActivityLogMessageParserUtils.getItemCategory(activityLog)
    const levelUuid = ActivityLog.getContentUuid(activityLog)
    const level = Category.getLevelByUuid(levelUuid)(category)

    return {
      index: CategoryLevel.getIndex(level),
      key: ActivityLog.getContentKey(activityLog),
      categoryName: Category.getName(category),
    }
  },

  [ActivityLog.type.categoryLevelDelete]: () => (activityLog) => {
    const category = ActivityLogMessageParserUtils.getItemCategory(activityLog)
    const index = ActivityLog.getContentIndex(activityLog)

    return {
      index,
      categoryName: Category.getName(category),
    }
  },

  // ===== CATEGORY ITEM

  [ActivityLog.type.categoryItemInsert]: () => (activityLog) => {
    const itemInserted = ActivityLog.getContent(activityLog)
    const category = ActivityLogMessageParserUtils.getItemCategory(activityLog)
    const levelUuid = CategoryItem.getLevelUuid(itemInserted)
    const level = Category.getLevelByUuid(levelUuid)(category)

    return {
      levelIndex: CategoryLevel.getIndex(level),
      categoryName: Category.getName(category),
    }
  },

  [ActivityLog.type.categoryItemPropUpdate]: () => (activityLog) => {
    const category = ActivityLogMessageParserUtils.getItemCategory(activityLog)

    return {
      code: ActivityLog.getContentCode(activityLog),
      key: ActivityLog.getContentKey(activityLog),
      categoryName: Category.getName(category),
    }
  },

  [ActivityLog.type.categoryItemDelete]: () => (activityLog) => {
    const category = ActivityLogMessageParserUtils.getItemCategory(activityLog)
    const levelUuid = ActivityLog.getContentLevelUuid(activityLog)
    const level = Category.getLevelByUuid(levelUuid)(category)

    return {
      code: ActivityLog.getContentCode(activityLog),
      levelIndex: CategoryLevel.getIndex(level),
      categoryName: Category.getName(category),
    }
  },

  // ===== CATEGORY IMPORT

  [ActivityLog.type.categoryImport]: () => (activityLog) => {
    const category = ActivityLogMessageParserUtils.getItemCategory(activityLog)

    return {
      categoryName: Category.getName(category),
    }
  },
}
