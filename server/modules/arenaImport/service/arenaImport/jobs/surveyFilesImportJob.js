import * as Survey from '@core/survey/survey'
import * as SurveyFile from '@core/survey/surveyFile'

import * as ArenaSurveyFileZip from '../model/arenaSurveyFileZip'
import { FileImportBaseJob } from './filesImportBaseJob'

export default class SurveyFilesImportJob extends FileImportBaseJob {
  constructor(params) {
    super('SurveyFilesImportJob', params)
  }

  async execute() {
    const { arenaSurveyFileZip, survey, surveyId, skipMissingFiles = false } = this.context

    const surveyInfo = Survey.getSurveyInfo(survey)
    const preloadedMapLayerFiles = Survey.getPreloadedMapLayers(surveyInfo)

    this.total = preloadedMapLayerFiles.length

    if (this.total > 0) {
      this.logDebug(`preloaded map layer files to import: ${this.total}`)
      await this.checkFilesNotExceedingAvailableQuota(preloadedMapLayerFiles)
      for (const fileSummary of preloadedMapLayerFiles) {
        if (this.isCanceled()) {
          break
        }
        let file = { ...fileSummary }

        // load file content
        const fileUuid = SurveyFile.getUuid(fileSummary)
        const fileName = SurveyFile.getName(fileSummary)
        const fileContent = await ArenaSurveyFileZip.getSurveyFile(arenaSurveyFileZip, fileUuid)

        if (!fileContent && !skipMissingFiles) {
          throw new Error(`Missing content for file ${fileUuid} (${fileName})`)
        }
        if (fileContent) {
          file = SurveyFile.assocContent(fileContent)(file)

          // update file size with actual file content length
          file = SurveyFile.assocSize(Buffer.byteLength(fileContent))(file)

          await this.persistFile(file)
        } else {
          this.logWarn(`Survey ${surveyId}: missing content for survey file ${fileUuid} (${fileName})`)
        }
        this.incrementProcessedItems()
      }
    }
  }
}
