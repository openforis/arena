import * as SurveyFile from '@core/survey/surveyFile'

import Job from '@server/job/job'
import * as SurveyFileService from '@server/modules/survey/service/surveyFileService'
import { ExportFile } from '../exportFile'
import * as DbUtils from '@server/db/dbUtils'

const SURVEY_FILE_TYPES_TO_EXPORT = [
  SurveyFile.SurveyFileType.preloadedMapLayer,
  SurveyFile.SurveyFileType.surveyDocImage,
  SurveyFile.SurveyFileType.brandingSurveyLogo1,
  SurveyFile.SurveyFileType.brandingSurveyLogo2,
  SurveyFile.SurveyFileType.brandingSurveyLogo3,
  SurveyFile.SurveyFileType.brandingLandingBackground,
  SurveyFile.SurveyFileType.chainMau,
]

export default class SurveyFilesExportJob extends Job {
  constructor(params) {
    super('SurveyFilesExportJob', params)
  }

  async execute() {
    const { archive, surveyId } = this.context

    const fileSummariesByType = await DbUtils.runQueries(
      this.tx,
      SURVEY_FILE_TYPES_TO_EXPORT.map(
        (type) => () => SurveyFileService.fetchFileSummariesByType({ surveyId, type }, this.tx)
      )
    )
    const fileSummaries = fileSummariesByType.flat()

    const filesCount = fileSummaries.length
    this.total = filesCount

    this.logDebug(`survey file(s) to export: ${filesCount}`)

    if (filesCount > 0) {
      // chain MAU files metadata (unlike preloaded map layers, doc images and branding images) is not part of
      // the survey definition itself, so it needs to be exported separately, alongside the file content
      const chainMauFileSummaries = fileSummaries.filter(
        (fileSummary) => SurveyFile.getType(fileSummary) === SurveyFile.SurveyFileType.chainMau
      )
      if (chainMauFileSummaries.length > 0) {
        archive.append(JSON.stringify(chainMauFileSummaries, null, 2), { name: ExportFile.chainMauFilesSummaries })
      }

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
