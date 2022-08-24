import * as PromiseUtils from '@core/promiseUtils'

import Job from '@server/job/job'
import * as CategoryService from '@server/modules/category/service/categoryService'
import { ExportFile } from '../exportFile'

export default class CategoriesExportJob extends Job {
  constructor(params) {
    super('CategoriesExportJob', params)
  }

  async execute() {
    const { archive, backup, surveyId } = this.context

    // categories.json: list of all categories with levels
    const categoriesPathFile = ExportFile.categories
    const draft = true // always include draft categories
    const categories = await CategoryService.fetchCategoriesAndLevelsBySurveyId({ surveyId, backup, draft }, this.tx)

    archive.append(JSON.stringify(categories, null, 2), { name: categoriesPathFile })

    // for each category create a  `${categoryUuid}.json` file with the category items
    const categoriesUuids = Object.keys(categories || {})
    this.total = categoriesUuids.length

    await PromiseUtils.each(categoriesUuids, async (categoryUuid) => {
      const itemsData = await CategoryService.fetchItemsByCategoryUuid({ surveyId, categoryUuid, backup }, this.tx)

      archive.append(JSON.stringify(itemsData, null, 2), {
        name: ExportFile.categoryItems({ categoryUuid }),
      })
      this.incrementProcessedItems()
    })
  }
}
