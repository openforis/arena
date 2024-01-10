import * as Survey from '@core/survey/survey'

import * as CategoryManager from '@server/modules/category/manager/categoryManager'

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
    const { survey } = this
    const surveyInfo = Survey.getSurveyInfo(survey)
    const defaultLang = Survey.getDefaultLanguage(surveyInfo)

    return CategoryManager.createImportSummaryFromStream({
      stream,
      defaultLang,
    })
  }
}

export default class CategoryBatchImportJob extends CategoryImportJob {
  constructor(params) {
    super(params, 'CategoryBatchImportJob', CategoryBatchImportInternalJob)
  }
}
