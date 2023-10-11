import * as PromiseUtils from '@core/promiseUtils'
import * as Category from '@core/survey/category'

import Job from '@server/job/job'
import * as FileUtils from '@server/utils/file/fileUtils'
import { ZipArchiver } from '@server/utils/file/zipArchiver'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as CategoryManager from '../manager/categoryManager'

export default class CategoriesExportJob extends Job {
  constructor(params, type = CategoriesExportJob.type) {
    super(type, params)
  }

  async execute() {
    const { surveyId, draft } = this.context

    // prepare temp output file
    const tempFileName = FileUtils.newTempFileName()
    const outputFilePath = FileUtils.tempFilePath(tempFileName)
    this.logDebug(`using temp output file: ${tempFileName}`)
    this.setContext({ tempFileName })

    // create archiver
    this.archiver = new ZipArchiver(FileUtils.createWriteStream(outputFilePath))

    // fetch list of categories
    const categories = await CategoryManager.fetchCategoriesBySurveyId({ surveyId, draft }, this.tx)
    this.total = categories.length

    // temp folder to be deleted on job end
    this.categoriesTempFolderName = FileUtils.newTempFolderName()
    await FileUtils.mkdir(FileUtils.tempFilePath(this.categoriesTempFolderName))

    // export categories one by one
    await PromiseUtils.each(categories, async (category, index) => {
      await this.exportCategory({ category, index })
    })
  }

  async exportCategory({ category, index }) {
    const { surveyId, draft } = this.context

    // create temp file
    const categoryTempFileName = FileUtils.newTempFileName()
    const categoryTempFilePath = FileUtils.tempFilePath(categoryTempFileName, this.categoriesTempFolderName)

    // export category into temp file
    const outputStream = FileUtils.createWriteStream(categoryTempFilePath)
    const survey = await SurveyManager.fetchSurveyById({ surveyId, draft })
    await CategoryManager.exportCategoryToStream({ survey, categoryUuid: category.uuid, draft, outputStream })

    // write to archive
    const zipEntryName = `${Category.getName(category) || `category_${index}`}.csv`
    this.archiver.addFile(categoryTempFilePath, zipEntryName)

    this.incrementProcessedItems()
  }

  async beforeSuccess() {
    const { tempFileName } = this.context

    this.setResult({ tempFileName })
  }

  async onEnd() {
    await super.onEnd()
    await this.archiver.finalize()

    // delete temp directory
    // TODO: delete the category temp files one by one once added to the archive
    await FileUtils.rmdir(FileUtils.tempFilePath(this.categoriesTempFolderName))
  }
}

CategoriesExportJob.type = 'CategoriesExportJob'
