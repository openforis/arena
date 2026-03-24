import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'
import * as CategoryItem from '@core/survey/categoryItem'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as ObjectUtils from '@core/objectUtils'

import Job from '@server/job/job'
import BatchPersister from '@server/db/batchPersister'

import * as CategoryManager from '../../../../category/manager/categoryManager'

import * as CollectSurvey from '../model/collectSurvey'

/**
 * Inserts a category for each code list in the Collect survey.
 * Saves the list of inserted categories in the "categories" context property.
 */
export default class CategoriesImportJob extends Job {
  constructor(params) {
    super('CategoriesImportJob', params)

    this.itemBatchPersister = new BatchPersister(this.itemsInsertHandler.bind(this))
    this.qualifiableItemCodesByCategoryAndLevel = {}
  }

  async execute() {
    const { tx } = this
    const { collectSurvey, defaultLanguage, survey } = this.context

    const categories = []

    const collectCodeLists = CollectSurvey.getElementsByPath(['codeLists', 'list'])(collectSurvey)

    this.total = collectCodeLists.length

    for (const collectCodeList of collectCodeLists) {
      if (this.isCanceled()) {
        break
      }

      // 1. insert a category for each collectCodeList
      const categoryName = collectCodeList.attributes.name

      if (!R.includes(categoryName, CollectSurvey.samplingPointDataCodeListNames)) {
        // Skip sampling_design (sampling point data) code list, imported by SamplingPointDataImportJob

        const category = await this._insertCategory(collectCodeList)

        // Insert items
        const collectFirstLevelItems = CollectSurvey.getElementsByPath(['items', 'item'])(collectCodeList)
        await this.insertItems(category, 0, null, defaultLanguage, collectFirstLevelItems, tx)

        categories.push(category)
      }

      this.incrementProcessedItems()
    }

    // Flush items batch persister
    await this.itemBatchPersister.flush(tx)

    // Validate categories (after all items have been persisted)
    const surveyUpdated = Survey.assocCategories(ObjectUtils.toUuidIndexedObj(categories))(survey)
    await CategoryManager.validateCategories(surveyUpdated, tx)

    this.setContext({
      qualifiableItemCodesByCategoryAndLevel: this.qualifiableItemCodesByCategoryAndLevel,
      survey: surveyUpdated,
    })
  }

  async _insertCategory(collectCodeList) {
    const categoryName = collectCodeList.attributes.name

    // Create category
    let categoryToCreate = Category.newCategory({
      [Category.keysProps.name]: categoryName,
    })

    // Create levels
    const hierarchyLevels = CollectSurvey.getElementsByPath(['hierarchy', 'level'])(collectCodeList)
    if (!R.isEmpty(hierarchyLevels)) {
      const levels = hierarchyLevels.map((hierarchyLevel, index) =>
        Category.newLevel(categoryToCreate, { [CategoryLevel.keysProps.name]: hierarchyLevel.attributes.name }, index)
      )
      categoryToCreate = Category.assocLevelsArray(levels)(categoryToCreate)
    }

    // Insert category and levels
    return CategoryManager.insertCategory(
      { user: this.user, surveyId: this.surveyId, category: categoryToCreate, system: true },
      this.tx
    )
  }

  async insertItems(category, levelIndex, parentItem, defaultLanguage, collectItems, tx) {
    const level = Category.getLevelByIndex(levelIndex)(category)
    const levelUuid = CategoryLevel.getUuid(level)

    for (const collectItem of collectItems) {
      if (this.isCanceled()) {
        break
      }

      const labels = CollectSurvey.toLabels('label', defaultLanguage)(collectItem)

      const itemCode = CollectSurvey.getChildElementText('code')(collectItem)
      const item = {
        ...CategoryItem.newItem(levelUuid, CategoryItem.getUuid(parentItem), {
          [CategoryItem.keysProps.code]: itemCode,
          [CategoryItem.keysProps.labels]: labels,
        }),
        categoryUuid: Category.getUuid(category), // Used to revalidate categories after items import
      }
      await this.itemBatchPersister.addItem(item, tx)

      // Update qualifiable item codes cache
      if (CollectSurvey.getAttribute('qualifiable')(collectItem) === 'true') {
        const code = CollectSurvey.getChildElementText('code')(collectItem)
        this.qualifiableItemCodesByCategoryAndLevel = R.pipe(
          R.pathOr([], [Category.getName(category), String(levelIndex)]),
          R.ifElse(R.includes(code), R.identity, R.append(code)),
          (codes) =>
            R.assocPath(
              [Category.getName(category), String(levelIndex)],
              codes,
              this.qualifiableItemCodesByCategoryAndLevel
            )
        )(this.qualifiableItemCodesByCategoryAndLevel)
      }

      // Insert child items recursively
      const collectChildItems = CollectSurvey.getElementsByName('item')(collectItem)
      if (!R.isEmpty(collectChildItems)) {
        await this.insertItems(category, levelIndex + 1, item, defaultLanguage, collectChildItems, tx)
      }
    }
  }

  async itemsInsertHandler(items, tx) {
    await CategoryManager.insertItems(this.user, this.surveyId, items, tx)
  }
}
