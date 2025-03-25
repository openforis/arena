import Job from '@server/job/job'
import * as ArenaSurveyFileZip from '@server/modules/arenaImport/service/arenaImport/model/arenaSurveyFileZip'
import * as CategoryService from '@server/modules/category/service/categoryService'
import * as CategoryManager from '@server/modules/category/manager/categoryManager'

import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as PromiseUtils from '@core/promiseUtils'

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

      await PromiseUtils.each(categoriesArray, async (category) => {
        if (!this.isCanceled()) {
          await this._insertCategory({ category })
          this.incrementProcessedItems()
        }
      })
      await CategoryManager.validateCategories(survey, this.tx)
    }
    this.setContext({ categories })
  }

  async _insertCategory({ category }) {
    const { arenaSurveyFileZip: zipFile, backup, surveyId } = this.context

    const categoryWithLevels = Category.assocLevelsArray(
      Category.getLevelsArray(category).map(CategoryLevel.assocCategoryUuid(Category.getUuid(category)))
    )(category)

    const categoryInserted = await CategoryService.insertCategory(
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
    const categoryUuid = Category.getUuid(categoryInserted)
    let items = await ArenaSurveyFileZip.getCategoryItems(zipFile, categoryUuid)
    if (items.length > 0) {
      // category items in a single file
      await CategoryService.insertItemsInBatch({ surveyId, items, backup }, this.tx)
    } else {
      // big category: items splitted in parts
      const partsCount = ArenaSurveyFileZip.getCategoryItemsPartsCount({ zipFile, categoryUuid })
      let partIndex = 0
      while (partIndex < partsCount) {
        items = await ArenaSurveyFileZip.getCategoryItemsPart({ zipFile, categoryUuid, index: partIndex })
        await CategoryService.insertItemsInBatch({ surveyId, items, backup }, this.tx)
        partIndex = partIndex + 1
      }
    }
  }
}
