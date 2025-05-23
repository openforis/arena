import Job from '@server/job/job'

import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'
import { FileFormats, getExtensionByFileFormat } from '@core/fileFormats'

import * as FileUtils from '@server/utils/file/fileUtils'
import * as CategoryManager from '@server/modules/category/manager/categoryManager'

const categoriesOutputFolderName = 'categories'

export default class CategoriesExportJob extends Job {
  constructor(params) {
    super('CategoriesExportJob', params)
  }

  async execute() {
    const { survey, outputDir, options } = this.context
    const { fileFormat = FileFormats.csv } = options ?? {}

    const categories = Survey.getCategoriesArray(survey)
    this.total = categories.length

    const categoriesDir = FileUtils.join(outputDir, categoriesOutputFolderName)
    await FileUtils.mkdir(categoriesDir)

    for (const category of categories) {
      const { uuid: categoryUuid } = category
      const extension = getExtensionByFileFormat(fileFormat)
      const categoryTempFilePath = FileUtils.join(categoriesDir, `${Category.getName(category)}.${extension}`)
      const outputStream = FileUtils.createWriteStream(categoryTempFilePath)
      await CategoryManager.exportCategoryToStream({ survey, categoryUuid, outputStream, fileFormat }, this.tx)
      this.incrementProcessedItems()
    }
  }
}
