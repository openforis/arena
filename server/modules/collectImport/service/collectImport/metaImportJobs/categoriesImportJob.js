const R = require('ramda')

const Category = require('@core/survey/category')
const CategoryItem = require('@core/survey/categoryItem')
const CategoryLevel = require('@core/survey/categoryLevel')
const ObjectUtils = require('@core/objectUtils')

const Job = require('@server/job/job')
const BatchPersister = require('@server/db/batchPersister')

const CategoryManager = require('../../../../category/manager/categoryManager')

const CollectSurvey = require('../model/collectSurvey')

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
    const { collectSurvey, defaultLanguage } = this.context

    const categories = []

    const collectCodeLists = CollectSurvey.getElementsByPath(['codeLists', 'list'])(collectSurvey)

    this.total = collectCodeLists.length

    for (const collectCodeList of collectCodeLists) {
      if (this.isCanceled())
        break

      // 1. insert a category for each collectCodeList
      const categoryName = collectCodeList.attributes.name

      if (!R.includes(categoryName, CollectSurvey.samplingPointDataCodeListNames)) {
        // skip sampling_design (sampling point data) code list, imported by SamplingPointDataImportJob

        const category = await this._insertCategory(collectCodeList)

        // insert items
        const collectFirstLevelItems = CollectSurvey.getElementsByPath(['items', 'item'])(collectCodeList)
        await this.insertItems(category, 0, null, defaultLanguage, collectFirstLevelItems, tx)

        categories.push(category)
      }

      this.incrementProcessedItems()
    }

    // flush items batch persister
    await this.itemBatchPersister.flush(tx)

    // validate categories (after all items have been persisted)
    await CategoryManager.validateCategories(this.surveyId, this.tx)

    // set categories in context
    this.setContext({
      categories,
      qualifiableItemCodesByCategoryAndLevel: this.qualifiableItemCodesByCategoryAndLevel
    })
  }

  async _insertCategory (collectCodeList) {
    const categoryName = collectCodeList.attributes.name

    // create category
    let categoryToCreate = Category.newCategory({
      [Category.props.name]: categoryName
    })

    // create levels
    const hierarchyLevels = CollectSurvey.getElementsByPath(['hierarchy', 'level'])(collectCodeList)
    if (!R.isEmpty(hierarchyLevels)) {
      const levels = hierarchyLevels.map((hierarchyLevel, index) =>
        Category.newLevel(categoryToCreate, { [CategoryLevel.keysProps.name]: hierarchyLevel.attributes.name }, index))
      categoryToCreate = Category.assocLevelsArray(levels)(categoryToCreate)
    }

    // insert category and levels
    return await CategoryManager.insertCategory(this.user, this.surveyId, categoryToCreate, true, this.tx)
  }

  async insertItems (category, levelIndex, parentItem, defaultLanguage, collectItems, tx) {
    const level = Category.getLevelByIndex(levelIndex)(category)
    const levelUuid = CategoryLevel.getUuid(level)

    for (const collectItem of collectItems) {
      if (this.isCanceled())
        break

      const labels = CollectSurvey.toLabels('label', defaultLanguage)(collectItem)

      const itemCode = CollectSurvey.getChildElementText('code')(collectItem)
      const item = {
        ...CategoryItem.newItem(levelUuid, CategoryItem.getUuid(parentItem), {
          [CategoryItem.props.code]: itemCode,
          [ObjectUtils.keysProps.labels]: labels,
        }),
        categoryUuid: Category.getUuid(category) //used to revalidate categories after items import
      }
      await this.itemBatchPersister.addItem(item, tx)

      // insert child items recursively
      const collectChildItems = CollectSurvey.getElementsByName('item')(collectItem)
      if (!R.isEmpty(collectChildItems)) {
        await this.insertItems(category, levelIndex + 1, item, defaultLanguage, collectChildItems, tx)
      }

      // update qualifiable item codes cache
      collectChildItems.forEach(collectItem => {
        if (CollectSurvey.getAttribute('qualifiable')(collectItem) === 'true') {
          const code = CollectSurvey.getChildElementText('code')(collectItem)
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
    await CategoryManager.insertItems(this.user, this.surveyId, items, tx)
  }

}

module.exports = CategoriesImportJob
