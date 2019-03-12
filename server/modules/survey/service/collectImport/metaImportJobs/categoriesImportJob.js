const R = require('ramda')

const Category = require('../../../../../../common/survey/category')

const Job = require('../../../../../job/job')

const CategoryManager = require('../../../../category/persistence/categoryManager')

const CollectIdmlParseUtils = require('./collectIdmlParseUtils')

/**
 * Inserts a category for each code list in the Collect survey.
 * Saves the list of inserted categories in the "categories" context property
 */
class CategoriesImportJob extends Job {

  constructor (params) {
    super('CategoriesImportJob', params)
  }

  async execute (tx) {
    const { collectSurvey, surveyId, defaultLanguage } = this.context

    const categories = []

    const codeLists = CollectIdmlParseUtils.getList(['codeLists', 'list'])(collectSurvey)

    this.total = codeLists.length

    for (const codeList of codeLists) {
      // 1. insert a category for each codeList
      const categoryParam = Category.newCategory({
        [Category.props.name]: codeList._attr.name
      })
      let category = await CategoryManager.insertCategory(this.getUser(), surveyId, categoryParam, tx)

      category = await insertLevels(this.getUser(), surveyId, category, codeList, tx)

      const firstLevelSourceItems = CollectIdmlParseUtils.getList(['items', 'item'])(codeList)
      await insertItems(this.getUser(), surveyId, category, 0, null, defaultLanguage, firstLevelSourceItems, tx)

      categories.push(category)

      this.incrementProcessedItems()
    }

    this.setContext({ categories })
  }
}

const insertLevels = async (user, surveyId, category, codeList, tx) => {
  const hierarchyLevels = CollectIdmlParseUtils.getList(['hierarchy', 'level'])(codeList)
  if (hierarchyLevels.length > 1) {
    let firstLevel = Category.getLevelByIndex(0)(category)
    const collectFirstLevel = hierarchyLevels[0]

    // update first level name
    firstLevel = await CategoryManager.updateLevelProp(user, surveyId, Category.getUuid(firstLevel), Category.levelProps.name, collectFirstLevel._attr.name, tx)
    category = Category.assocLevel(firstLevel)(category)

    // insert other levels
    for (let i = 1; i < hierarchyLevels.length; i++) {
      const hierarchyLevel = hierarchyLevels[i]
      const levelParam = Category.assocLevelName(hierarchyLevel._attr.name)(Category.newLevel(category))
      const level = await CategoryManager.insertLevel(user, surveyId, Category.getUuid(category), levelParam, tx)

      category = Category.assocLevel(level)(category)
    }
  }
  return category
}

const insertItems = async (user, surveyId, category, levelIndex, parentItem, defaultLanguage, sourceItems, tx) => {
  const level = Category.getLevelByIndex(levelIndex)(category)
  const levelUuid = Category.getUuid(level)

  for (const collectItem of sourceItems) {
    const labels = CollectIdmlParseUtils.toLabels(collectItem.label, defaultLanguage)

    const itemParam = Category.newItem(levelUuid, parentItem, {
      [Category.itemProps.code]: collectItem.code,
      [Category.itemProps.labels]: labels
    })
    const item = await CategoryManager.insertItem(user, surveyId, itemParam, tx)

    // insert child items recursively
    const childItems = CollectIdmlParseUtils.getList(['item'])(collectItem)
    if (!R.isEmpty(childItems))
      await insertItems(user, surveyId, category, levelIndex + 1, item, defaultLanguage, childItems, tx)
  }
}

module.exports = CategoriesImportJob
