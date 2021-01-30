import Job from '@server/job/job'
import * as ArenaSurveyFileZip from '@server/modules/arenaImport/service/arenaImport/model/arenaSurveyFileZip'
import * as CategoryService from '@server/modules/category/service/categoryService'
import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as CategoryManager from '@server/modules/category/manager/categoryManager'

const insertCategory = async ({ category, user, surveyId, arenaSurveyFileZip }) => {
  const categoryWithLevels = Category.assocLevelsArray(
    Category.getLevelsArray(category).map(CategoryLevel.assocCategoryUuid(Category.getUuid(category)))
  )(category)

  const categoryInserted = await CategoryService.insertCategory({
    user,
    surveyId,
    category: categoryWithLevels,
    addLogs: false,
  })
  const items = await ArenaSurveyFileZip.getCategoryItems(arenaSurveyFileZip, Category.getUuid(categoryInserted))
  await CategoryService.insertItemsInBatch(surveyId, items)
}

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

    const categories = await ArenaSurveyFileZip.getCategories(arenaSurveyFileZip)

    const categoriesArray = Object.values(categories || {})
    await Promise.all(
      categoriesArray.map(async (category) =>
        insertCategory({ category, user: this.user, surveyId, arenaSurveyFileZip })
      )
    )

    await CategoryManager.validateCategories(surveyId)

    this.setContext({ categories })
  }
}
