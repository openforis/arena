const R = require('ramda')

const Category = require('../../../../../../common/survey/category')
const CategoryItem = require('../../../../../../common/survey/categoryItem')
const CategoryLevel = require('../../../../../../common/survey/categoryLevel')
const ObjectUtils = require('../../../../../../common/objectUtils')

const Job = require('../../../../../job/job')
const BatchPersister = require('../../../../../db/batchPersister')

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
    const { collectSurvey, surveyId, defaultLanguage } = this.context

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

        const categoryToCreate = Category.newCategory({
          [Category.props.name]: categoryName
        })
        let category = await CategoryManager.insertCategory(this.user, surveyId, categoryToCreate, tx)

        category = await this.insertLevels(category, collectCodeList, tx)

        const collectFirstLevelItems = CollectSurvey.getElementsByPath(['items', 'item'])(collectCodeList)
        await this.insertItems(category, 0, null, defaultLanguage, collectFirstLevelItems, tx)

        categories.push(category)
      }

      this.incrementProcessedItems()
    }

    await this.itemBatchPersister.flush(tx)

    this.setContext({
      categories,
      qualifiableItemCodesByCategoryAndLevel: this.qualifiableItemCodesByCategoryAndLevel
    })
  }

  async insertLevels (category, codeList, tx) {
    const hierarchyLevels = CollectSurvey.getElementsByPath(['hierarchy', 'level'])(codeList)
    if (hierarchyLevels.length > 1) {
      let firstLevel = Category.getLevelByIndex(0)(category)
      const collectFirstLevel = hierarchyLevels[0]

      // update first level name
      firstLevel = await CategoryManager.updateLevelProp(this.user, this.surveyId, Category.getUuid(firstLevel), CategoryLevel.props.name, collectFirstLevel.attributes.name, tx)
      category = Category.assocLevel(firstLevel)(category)

      // insert other levels
      for (let i = 1; i < hierarchyLevels.length; i++) {
        if (this.isCanceled())
          break

        const hierarchyLevel = hierarchyLevels[i]
        const levelToCreate = Category.assocLevelName(hierarchyLevel.attributes.name)(Category.newLevel(category))
        const level = await CategoryManager.insertLevel(this.user, this.surveyId, levelToCreate, tx)

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

      const labels = CollectSurvey.toLabels('label', defaultLanguage)(collectItem)

      const itemCode = CollectSurvey.getChildElementText('code')(collectItem)
      const item = CategoryItem.newItem(levelUuid, CategoryItem.getUuid(parentItem), {
        [CategoryItem.props.code]: itemCode,
        [ObjectUtils.keysProps.labels]: labels
      })
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
