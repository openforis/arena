import Job from '@server/job/job'

import * as FileUtils from '@server/utils/file/fileUtils'

import * as SurveyService from '@server/modules/survey/service/surveyService'

import CSVDataExtractionJob from './jobs/CSVDataExtractionJob'
import CategoriesExportJob from './jobs/CategoriesExportJob'
import FilesExportJob from './jobs/FilesExportJob'
import ZipCreationJob from './jobs/ZipCreationJob'

const createInternalJobs = (params) => {
  const { options } = params ?? {}
  const { includeCategories, includeFiles } = options ?? {}
  return [
    new CSVDataExtractionJob(),
    ...(includeCategories ? [new CategoriesExportJob()] : []),
    ...(includeFiles ? [new FilesExportJob()] : []),
    new ZipCreationJob(),
  ]
}

export default class DataExportJob extends Job {
  constructor(params) {
    super(DataExportJob.type, params, createInternalJobs(params))
  }

  async onStart() {
    await super.onStart()

    // exportUuid will be used when dowloading the generated output file
    // the generated zip file will be named `${exportUuid}.zip`
    const exportUuid = this.uuid
    // use job uuid as temp folder name
    const outputDir = FileUtils.tempFilePath(exportUuid)

    // delete output dir if already existing (it shouldn't be possible...)
    await FileUtils.rmdir(outputDir)

    await FileUtils.mkdir(outputDir)

    const survey = await this._fetchSurvey()

    this.setContext({
      exportUuid,
      outputDir,
      survey,
    })
  }

  async _fetchSurvey() {
    const { surveyId, cycle, options } = this.context
    const { includeAnalysis, includeDataFromAllCycles, expandCategoryItems } = options
    const cycleToFetch = includeDataFromAllCycles ? undefined : cycle

    return expandCategoryItems
      ? await SurveyService.fetchSurveyAndNodeDefsAndRefDataBySurveyId({
          surveyId,
          cycle: cycleToFetch,
          includeAnalysis,
          includeBigCategories: false,
          includeBigTaxonomies: false,
        })
      : await SurveyService.fetchSurveyAndNodeDefsBySurveyId({
          surveyId,
          cycle: cycleToFetch,
          includeAnalysis,
        })
  }

  async beforeSuccess() {
    await super.beforeSuccess()

    const { exportUuid } = this.context

    this.setResult({
      exportUuid,
    })
  }

  async beforeEnd() {
    await super.beforeEnd()

    const { outputDir } = this.context

    await FileUtils.rmdir(outputDir)
  }
}

DataExportJob.type = 'DataExportJob'
