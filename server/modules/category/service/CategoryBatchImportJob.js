import * as Survey from '@core/survey/survey'
import { FileFormats } from '@core/fileFormats'

import * as CategoryManager from '@server/modules/category/manager/categoryManager'
import * as FileUtils from '@server/utils/file/fileUtils'

import CategoryImportJob, { CategoryImportInternalJob } from './categoryImportJob'

class CategoryBatchImportInternalJob extends CategoryImportInternalJob {
  constructor(params) {
    super(params, 'CategoryBatchImportInternalJob')
  }

  async createReadStream() {
    const { fileZipEntryName, fileZip } = this.context
    return fileZip.getEntryStream(fileZipEntryName)
  }

  async getOrCreateSummary() {
    const stream = await this.createReadStream()
    const { survey, context } = this
    const { fileZipEntryName } = context
    const surveyInfo = Survey.getSurveyInfo(survey)
    const defaultLang = Survey.getDefaultLanguage(surveyInfo)
    const fileFormat = FileUtils.getFileExtension(fileZipEntryName) === 'xlsx' ? FileFormats.xlsx : FileFormats.csv
    return CategoryManager.createImportSummaryFromStream({ stream, fileFormat, defaultLang })
  }
}

export default class CategoryBatchImportJob extends CategoryImportJob {
  constructor(params) {
    super(params, 'CategoryBatchImportJob', CategoryBatchImportInternalJob)
  }
}
