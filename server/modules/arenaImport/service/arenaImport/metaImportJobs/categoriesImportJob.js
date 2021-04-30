import Job from '@server/job/job'
import * as ArenaSurveyFileZip from '@server/modules/arenaImport/service/arenaImport/model/arenaSurveyFileZip'
import * as CategoryService from '@server/modules/category/service/categoryService'
import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as CategoryManager from '@server/modules/category/manager/categoryManager'

/**
 * Inserts a category for each code list in the Collect survey.
 * Saves the list of inserted categories in the "categories" context property.
 */
export default class CategoriesImportJob extends Job {
  constructor(params) {
    super('CategoriesImportJob', params)
  }

  async execute() {
    const { arenaSurveyFileZip, surveyId } = this.context

    const categories = (await ArenaSurveyFileZip.getCategories(arenaSurveyFileZip)) || {}

    const categoriesArray = Object.values(categories)
    if (categoriesArray.length > 0) {
      await Promise.all(categoriesArray.map(async (category) => this._insertCategory({ category })))
      await CategoryManager.validateCategories(surveyId, this.tx)
    }
    this.setContext({ categories })
  }

  async _insertCategory({ category }) {
    const { arenaSurveyFileZip, backup, surveyId } = this.context

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
    const items = await ArenaSurveyFileZip.getCategoryItems(arenaSurveyFileZip, Category.getUuid(categoryInserted))
    await CategoryService.insertItemsInBatch({ surveyId, items, backup, client: this.tx })
  }
}
