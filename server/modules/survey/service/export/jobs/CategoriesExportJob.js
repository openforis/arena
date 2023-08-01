import Job from '@server/job/job'

import * as PromiseUtils from '@core/promiseUtils'
import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'

import * as FileUtils from '@server/utils/file/fileUtils'
import * as CategoryManager from '@server/modules/category/manager/categoryManager'

const categoriesOutputFolderName = 'categories'

export default class CategoriesExportJob extends Job {
  constructor(params) {
    super('CategoriesExportJob', params)
  }

  async execute() {
    const { survey, outputDir } = this.context

    const categories = Survey.getCategoriesArray(survey)
    this.total = categories.length

    const categoriesDir = FileUtils.join(outputDir, categoriesOutputFolderName)
    await FileUtils.mkdir(categoriesDir)

    await PromiseUtils.each(categories, async (category) => {
      const categoryTempFilePath = FileUtils.join(categoriesDir, `${Category.getName(category)}.csv`)
      const categoryOutputStream = FileUtils.createWriteStream(categoryTempFilePath)
      await CategoryManager.exportCategoryToStream(
        {
          survey,
          categoryUuid: category.uuid,
          outputStream: categoryOutputStream,
        },
        this.tx
      )
      this.incrementProcessedItems()
    })
  }
}
