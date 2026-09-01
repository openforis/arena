import * as SurveyFile from '@core/survey/surveyFile'

import Job from '@server/job/job'
import * as SurveyFileService from '@server/modules/survey/service/surveyFileService'
import { ExportFile } from '../exportFile'

const SURVEY_FILE_TYPES_TO_EXPORT = [
  SurveyFile.SurveyFileType.preloadedMapLayer,
  SurveyFile.SurveyFileType.surveyDocImage,
  SurveyFile.SurveyFileType.brandingSurveyLogo1,
  SurveyFile.SurveyFileType.brandingSurveyLogo2,
  SurveyFile.SurveyFileType.brandingSurveyLogo3,
  SurveyFile.SurveyFileType.brandingLandingBackground,
]

export default class SurveyFilesExportJob extends Job {
  constructor(params) {
    super('SurveyFilesExportJob', params)
  }

  async execute() {
    const { archive, surveyId } = this.context

    const fileSummariesByType = await Promise.all(
      SURVEY_FILE_TYPES_TO_EXPORT.map((type) => SurveyFileService.fetchFileSummariesByType({ surveyId, type }, this.tx))
    )
    const fileSummaries = fileSummariesByType.flat()

    const filesCount = fileSummaries.length
    this.total = filesCount

    this.logDebug(`survey file(s) to export: ${filesCount}`)

    if (filesCount > 0) {
      // write each file content into a separate binary file
      for (const fileSummary of fileSummaries) {
        if (this.isCanceled()) {
          break
        }
        const fileUuid = SurveyFile.getUuid(fileSummary)
        const fileContentStream = await SurveyFileService.fetchFileContentAsStream({ surveyId, fileSummary }, this.tx)
        const archiveEntryName = ExportFile.surveyFile({ fileUuid })
        archive.append(fileContentStream, { name: archiveEntryName })

        this.incrementProcessedItems()
      }
    }
  }
}
