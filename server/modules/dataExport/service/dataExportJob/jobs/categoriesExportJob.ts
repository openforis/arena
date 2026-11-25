import { FileFormats, getExtensionByFileFormat } from '@core/fileFormats'
import * as Category from '@core/survey/category'
import * as Survey from '@core/survey/survey'
import Job, { type JobParams } from '@server/job/job'
import * as CategoryManager from '@server/modules/category/manager/categoryManager'
import { toSafeFileName } from '@server/utils/file/fileNames'
import * as FileUtils from '@server/utils/file/fileUtils'

const categoriesOutputFolderName = 'categories'

export default class CategoriesExportJob extends Job {
  constructor(params?: Partial<JobParams>) {
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
      const fileName = toSafeFileName(Category.getName(category)) || categoryUuid
      const categoryTempFilePath = FileUtils.join(categoriesDir, `${fileName}.${extension}`)
      const outputStream = FileUtils.createWriteStream(categoryTempFilePath)
      await CategoryManager.exportCategoryToStream({ survey, categoryUuid, outputStream, fileFormat }, this.tx) // NOSONAR
      this.incrementProcessedItems()
    }
  }
}
