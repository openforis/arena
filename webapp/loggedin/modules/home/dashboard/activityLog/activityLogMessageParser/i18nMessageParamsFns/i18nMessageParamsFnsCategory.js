import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as CategoryItem from '@core/survey/categoryItem'

import * as ActivityLog from '@common/activityLog/activityLog'

import * as ActivityLogMessageParserUtils from '../activityLogMessageParserUtils'

export default {

  // ===== CATEGORY

  [ActivityLog.type.categoryPropUpdate]: survey => activityLog => {
    const categoryUuid = ActivityLog.getContentUuid(activityLog)
    const category = Survey.getCategoryByUuid(categoryUuid)(survey)

    return {
      key: ActivityLog.getContentKey(activityLog),
      categoryName: Category.getName(category)
    }
  },

  [ActivityLog.type.categoryDelete]: () => activityLog => ({
    categoryName: ActivityLog.getContentCategoryName(activityLog),
  }),

  // ===== CATEGORY LEVEL

  [ActivityLog.type.categoryLevelInsert]: survey => activityLog => {
    const categoryLevelInserted = ActivityLog.getContent(activityLog)
    const category = ActivityLogMessageParserUtils.getItemCategory(survey)(activityLog)

    return {
      index: CategoryLevel.getIndex(categoryLevelInserted),
      categoryName: Category.getName(category)
    }
  },

  [ActivityLog.type.categoryLevelPropUpdate]: survey => activityLog => {
    const category = ActivityLogMessageParserUtils.getItemCategory(survey)(activityLog)
    const levelUuid = ActivityLog.getContentUuid(activityLog)
    const level = Category.getLevelByUuid(levelUuid)(category)

    return {
      index: CategoryLevel.getIndex(level),
      key: ActivityLog.getContentKey(activityLog),
      categoryName: Category.getName(category)
    }
  },

  [ActivityLog.type.categoryLevelDelete]: survey => activityLog => {
    const category = ActivityLogMessageParserUtils.getItemCategory(survey)(activityLog)
    const index = ActivityLog.getContentIndex(activityLog)

    return {
      index,
      categoryName: Category.getName(category)
    }
  },

  // ===== CATEGORY ITEM

  [ActivityLog.type.categoryItemInsert]: survey => activityLog => {
    const itemInserted = ActivityLog.getContent(activityLog)
    const category = ActivityLogMessageParserUtils.getItemCategory(survey)(activityLog)
    const levelUuid = CategoryItem.getLevelUuid(itemInserted)
    const level = Category.getLevelByUuid(levelUuid)(category)

    return {
      levelIndex: CategoryLevel.getIndex(level),
      categoryName: Category.getName(category),
    }
  },

  [ActivityLog.type.categoryItemPropUpdate]: survey => activityLog => {
    const category = ActivityLogMessageParserUtils.getItemCategory(survey)(activityLog)

    return {
      code: ActivityLog.getContentCode(activityLog),
      key: ActivityLog.getContentKey(activityLog),
      categoryName: Category.getName(category)
    }
  },

  [ActivityLog.type.categoryItemDelete]: survey => activityLog => {
    const category = ActivityLogMessageParserUtils.getItemCategory(survey)(activityLog)
    const levelUuid = ActivityLog.getContentLevelUuid(activityLog)
    const level = Category.getLevelByUuid(levelUuid)(category)

    return {
      code: ActivityLog.getContentCode(activityLog),
      levelIndex: CategoryLevel.getIndex(level),
      categoryName: Category.getName(category)
    }
  },

  // ===== CATEGORY IMPORT

  [ActivityLog.type.categoryImport]: survey => activityLog => {
    const category = ActivityLogMessageParserUtils.getItemCategory(survey)(activityLog)

    return {
      categoryName: Category.getName(category)
    }
  },
}

