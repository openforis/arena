const R = require('ramda')

const Category = require('../../../../../../common/survey/category')
const CategoryItem = require('../../../../../../common/survey/categoryItem')
const CategoryLevel = require('../../../../../../common/survey/categoryLevel')

const Job = require('../../../../../job/job')
const BatchPersister = require('../../../../../db/batchPersister')

const CategoryManager = require('../../../../category/manager/categoryManager')

const CollectIdmlParseUtils = require('./collectIdmlParseUtils')

/**
 * Inserts a category for each code list in the Collect survey.
 * Saves the list of inserted categories in the "categories" context property
 */
class CategoriesImportJob extends Job {

  constructor (params) {
    super('CategoriesImportJob', params)

    this.itemBatchPersister = new BatchPersister(this.itemsInsertHandler.bind(this))
    this.qualifiableItemCodesByCategoryAndLevel = {}
  }

  async execute (tx) {
    const { collectSurvey, surveyId, defaultLanguage } = this.context

    const categories = []

    const collectCodeLists = CollectIdmlParseUtils.getElementsByPath(['codeLists', 'list'])(collectSurvey)

    this.total = collectCodeLists.length

    for (const collectCodeList of collectCodeLists) {
      if (this.isCanceled())
        break

      // 1. insert a category for each collectCodeList
      const categoryToCreate = Category.newCategory({
        [Category.props.name]: collectCodeList.attributes.name
      })
      let category = await CategoryManager.insertCategory(this.getUser(), surveyId, categoryToCreate, tx)

      category = await this.insertLevels(category, collectCodeList, tx)

      const collectFirstLevelItems = CollectIdmlParseUtils.getElementsByPath(['items', 'item'])(collectCodeList)
      await this.insertItems(category, 0, null, defaultLanguage, collectFirstLevelItems, tx)

      categories.push(category)

      this.incrementProcessedItems()
    }

    await this.itemBatchPersister.flush(tx)

    this.setContext({
      categories,
      qualifiableItemCodesByCategoryAndLevel: this.qualifiableItemCodesByCategoryAndLevel
    })
  }

  async insertLevels (category, codeList, tx) {
    const user = this.getUser()
    const surveyId = this.getSurveyId()

    const hierarchyLevels = CollectIdmlParseUtils.getElementsByPath(['hierarchy', 'level'])(codeList)
    if (hierarchyLevels.length > 1) {
      let firstLevel = Category.getLevelByIndex(0)(category)
      const collectFirstLevel = hierarchyLevels[0]

      // update first level name
      firstLevel = await CategoryManager.updateLevelProp(user, surveyId, Category.getUuid(firstLevel), CategoryLevel.props.name, collectFirstLevel.attributes.name, tx)
      category = Category.assocLevel(firstLevel)(category)

      // insert other levels
      for (let i = 1; i < hierarchyLevels.length; i++) {
        if (this.isCanceled())
          break

        const hierarchyLevel = hierarchyLevels[i]
        const levelToCreate = Category.assocLevelName(hierarchyLevel.attributes.name)(Category.newLevel(category))
        const level = await CategoryManager.insertLevel(user, surveyId, Category.getUuid(category), levelToCreate, tx)

        category = Category.assocLevel(level)(category)
      }
    }
    return category
  }

  async insertItems (category, levelIndex, parentItem, defaultLanguage, collectItems, tx) {
    const level = Category.getLevelByIndex(levelIndex)(category)
    const levelUuid = Category.getUuid(level)

    for (const collectItem of collectItems) {
      if (this.isCanceled())
        break

      const labels = CollectIdmlParseUtils.toLabels('label', defaultLanguage)(collectItem)

      const itemCode = CollectIdmlParseUtils.getChildElementText('code')(collectItem)
      const item = CategoryItem.newItem(levelUuid, parentItem, {
        [CategoryItem.props.code]: itemCode,
        [CategoryItem.props.labels]: labels
      })
      await this.itemBatchPersister.addItem(item, tx)

      // insert child items recursively
      const collectChildItems = CollectIdmlParseUtils.getElementsByName('item')(collectItem)
      if (!R.isEmpty(collectChildItems)) {
        await this.insertItems(category, levelIndex + 1, item, defaultLanguage, collectChildItems, tx)
      }

      // update qualifiable item codes cache
      collectChildItems.forEach(collectItem => {
        if (CollectIdmlParseUtils.getAttribute('qualifiable')(collectItem) === 'true') {
          const code = CollectIdmlParseUtils.getChildElementText('code')(collectItem)
          this.qualifiableItemCodesByCategoryAndLevel = R.pipe(
            R.pathOr([], [Category.getName(category), levelIndex + '']),
            R.ifElse(
              R.includes(code),
              R.identity,
              R.append(code)
            ),
            codes => R.assocPath([Category.getName(category), levelIndex + ''], codes, this.qualifiableItemCodesByCategoryAndLevel)
          )(this.qualifiableItemCodesByCategoryAndLevel)
        }
      })
    }
  }

  async itemsInsertHandler (items, tx) {
    const surveyId = this.getSurveyId()

    await CategoryManager.insertItems(surveyId, items, tx)
  }

}

module.exports = CategoriesImportJob
