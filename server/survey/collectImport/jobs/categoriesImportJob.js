const R = require('ramda')

const Category = require('../../../../common/survey/category')

const Job = require('../../../job/job')

const CategoryManager = require('../../../category/categoryManager')

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

    const codeLists = CollectIdmlParseUtils.toList(collectSurvey.codeLists.list)

    this.total = codeLists.length

    for (const codeListSource of codeLists) {
      // 1. insert a category for each codeList
      const categoryParam = Category.newCategory({
        [Category.props.name]: codeListSource._attr.name
      })
      let category = await CategoryManager.insertCategory(this.user, surveyId, categoryParam, tx)

      category = await insertLevels(this.user, surveyId, category, codeListSource, tx)

      const firstLevelSourceItems = CollectIdmlParseUtils.getList(['items', 'item'])(codeListSource)
      await insertItems(this.user, surveyId, category, 0, null, defaultLanguage, firstLevelSourceItems, tx)

      categories.push(category)

      this.incrementProcessedItems()
    }

    this.setContext({ categories })
  }
}

const insertLevels = async (user, surveyId, category, codeListSource, tx) => {
  const hierarchyLevels = CollectIdmlParseUtils.getList(['hierarchy', 'level'])(codeListSource)
  if (hierarchyLevels.length > 1) {
    let firstLevel = Category.getLevelByIndex(0)(category)
    const firstLevelSource = hierarchyLevels[0]

    // update first level name
    firstLevel = await CategoryManager.updateLevelProp(user, surveyId, Category.getUuid(firstLevel), Category.levelProps.name, firstLevelSource._attr.name, tx)
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

  for (const itemSource of sourceItems) {
    const labels = CollectIdmlParseUtils.toLabels(itemSource.label, defaultLanguage)

    const itemParam = Category.newItem(levelUuid, parentItem, {
      [Category.itemProps.code]: itemSource.code,
      [Category.itemProps.labels]: labels
    })
    const item = await CategoryManager.insertItem(user, surveyId, itemParam, tx)

    // insert child items recursively
    const childItems = CollectIdmlParseUtils.getList(['item'])(itemSource)
    if (!R.isEmpty(childItems))
      await insertItems(user, surveyId, category, levelIndex + 1, item, defaultLanguage, childItems, tx)
  }
}

module.exports = CategoriesImportJob
