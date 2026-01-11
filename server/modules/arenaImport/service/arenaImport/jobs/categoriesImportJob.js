import Job from '@server/job/job'
import * as ArenaSurveyFileZip from '@server/modules/arenaImport/service/arenaImport/model/arenaSurveyFileZip'
import * as CategoryService from '@server/modules/category/service/categoryService'
import * as CategoryManager from '@server/modules/category/manager/categoryManager'

import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'

/**
 * Inserts a category for each code list in the Collect survey.
 * Saves the list of inserted categories in the "categories" context property.
 */
export default class CategoriesImportJob extends Job {
  constructor(params) {
    super('CategoriesImportJob', params)
  }

  async execute() {
    const { arenaSurveyFileZip, survey } = this.context

    const categories = await ArenaSurveyFileZip.getCategories(arenaSurveyFileZip)

    const categoriesArray = Object.values(categories)
    if (categoriesArray.length > 0) {
      this.total = categoriesArray.length

      for (const category of categoriesArray) {
        if (!this.isCanceled()) {
          await this._insertCategory({ category })
          this.incrementProcessedItems()
        }
      }
      await CategoryManager.validateCategories(survey, this.tx)
    }
    this.setContext({ categories })
  }

  async _insertCategory({ category }) {
    const { arenaSurveyFileZip: zipFile, backup, surveyId } = this.context

    const categoryUuid = Category.getUuid(category)
    const levelsWithCategoryUuid = Category.getLevelsArray(category).map(CategoryLevel.assocCategoryUuid(categoryUuid))
    const categoryWithLevels = Category.assocLevelsArray(levelsWithCategoryUuid)(category)

    await CategoryService.insertCategory(
      {
        user: this.user,
        surveyId,
        category: categoryWithLevels,
        addLogs: false,
        validate: false,
        backup,
      },
      this.tx
    )

    let items = await ArenaSurveyFileZip.getCategoryItems(zipFile, categoryUuid)
    if (items.length > 0) {
      // category items in a single file
      this.logDebug(`Inserting ${items.length} items for category ${Category.getName(category)}`)
      await CategoryService.insertItemsInBatch({ surveyId, items, backup }, this.tx)
    } else {
      // big category: items splitted in parts
      this.logDebug(`Inserting items in parts for category ${Category.getName(category)}`)
      const partsCount = ArenaSurveyFileZip.getCategoryItemsPartsCount({ zipFile, categoryUuid })

      try {
        let partIndex = 0
        while (partIndex < partsCount) {
          this.logDebug(`Inserting part ${partIndex + 1} of ${partsCount} for category ${Category.getName(category)}`)
          items = await ArenaSurveyFileZip.getCategoryItemsPart({ zipFile, categoryUuid, index: partIndex })
          await CategoryService.insertItemsInBatch({ surveyId, items, backup }, this.tx)
          partIndex = partIndex + 1
        }
      } catch (error) {
        this.logDebug(
          `Error occurred during parts insertion for category ${Category.getName(category)}: ${error.message}`
        )
        this.logDebug(`Falling back to inserting all parts at once for category ${Category.getName(category)}`)

        let totalItems = []
        for (let i = 0; i < partsCount; i++) {
          let partItems = await ArenaSurveyFileZip.getCategoryItemsPart({ zipFile, categoryUuid, index: i })
          totalItems = totalItems.concat(partItems)
        }
        this.logDebug(`Total items to insert for category ${Category.getName(category)}: ${totalItems.length}`)
        await CategoryService.insertItemsInBatch({ surveyId, items: totalItems, backup }, this.tx)
      }
    }
    await CategoryService.initializeSurveyCategoryItemsIndexes({ surveyId, category: categoryWithLevels }, this.tx)
  }
}
