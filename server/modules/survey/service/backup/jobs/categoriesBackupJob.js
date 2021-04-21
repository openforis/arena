import Job from '@server/job/job'
import * as CategoryService from '@server/modules/category/service/categoryService'
import * as FileUtils from '@server/utils/file/fileUtils'

export default class CategoriesBackupJob extends Job {
  constructor(params) {
    super('CategoriesBackupJob', params)
  }

  async execute() {
    const { archive, surveyId } = this.context

    // categories.json: list of all categories with levels
    const categoriesPathDir = 'categories'
    const categoriesPathFile = FileUtils.join(categoriesPathDir, 'categories.json')
    const categories = await CategoryService.fetchCategoriesAndLevelsBySurveyId({
      surveyId,
      draft: true,
      backup: true,
    })
    const categoriesUuids = Object.keys(categories || {})
    archive.append(JSON.stringify(categories, null, 2), { name: categoriesPathFile })

    // for each category create a  `${categoryUuid}.json` file with the category items
    await Promise.all(
      categoriesUuids.map(async (categoryUuid) => {
        const itemsData = await CategoryService.fetchItemsByCategoryUuid({
          surveyId,
          categoryUuid,
          draft: true,
          backup: true,
        })
        archive.append(JSON.stringify(itemsData, null, 2), {
          name: FileUtils.join(categoriesPathDir, `${categoryUuid}.json`),
        })
      })
    )
  }
}
