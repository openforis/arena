import * as User from '@core/user/user'

import Job from '@server/job/job'
import * as SurveyService from '@server/modules/survey/service/surveyService'
import * as FileUtils from '@server/utils/file/fileUtils'
import { DownloadAuthTokenUtils } from '@server/utils/downloadAuthTokenUtils'

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

    this.adjustCycle()

    const survey = await this._fetchSurvey()

    this.setContext({
      exportUuid,
      outputDir,
      survey,
    })
  }

  adjustCycle() {
    const { cycle, options } = this.context
    const { includeDataFromAllCycles } = options
    const cycleToUse = includeDataFromAllCycles ? undefined : cycle
    this.setContext({ cycle: cycleToUse })
  }

  async _fetchSurvey() {
    const { surveyId, cycle, options } = this.context
    const { includeAnalysis, expandCategoryItems } = options

    return expandCategoryItems
      ? await SurveyService.fetchSurveyAndNodeDefsAndRefDataBySurveyId({
          surveyId,
          cycle,
          includeAnalysis,
        })
      : await SurveyService.fetchSurveyAndNodeDefsBySurveyId({
          surveyId,
          cycle,
          includeAnalysis,
        })
  }

  generateResult() {
    const result = super.generateResult()

    const { token: downloadToken } = this.generateDownloadToken()

    return { ...result, downloadToken }
  }

  async beforeEnd() {
    await super.beforeEnd()

    const { outputDir } = this.context

    await FileUtils.rmdir(outputDir)
  }

  generateDownloadToken() {
    this.logDebug('Generating download token')

    const { user, outputFileName } = this.context

    const userUuid = User.getUuid(user)

    return DownloadAuthTokenUtils.generateToken({ userUuid, fileName: outputFileName })
  }
}

DataExportJob.type = 'DataExportJob'
