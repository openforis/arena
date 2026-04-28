import * as SurveyFile from '@core/survey/surveyFile'

import Job from '@server/job/job'
import * as SurveyFileService from '@server/modules/survey/service/surveyFileService'
import { ExportFile } from '../exportFile'

export default class SurveyFilesExportJob extends Job {
  constructor(params) {
    super('SurveyFilesExportJob', params)
  }

  async execute() {
    const { archive, surveyId } = this.context

    const preloadedMapLayersFiles = await SurveyFileService.fetchFileSummariesByType(
      { surveyId, type: SurveyFile.SurveyFileType.preloadedMapLayer },
      this.tx
    )

    const filesCount = preloadedMapLayersFiles.length
    this.total = filesCount

    this.logDebug(`survey file(s) to export: ${filesCount}`)

    if (filesCount > 0) {
      // write each file content into a separate binary file
      for (const fileSummary of preloadedMapLayersFiles) {
        if (this.isCanceled()) {
          break
        }
        const fileUuid = SurveyFile.getUuid(fileSummary)
        const fileContentStream = await SurveyFileService.fetchFileContentAsStream({ surveyId, fileUuid }, this.tx)
        const archiveEntryName = ExportFile.surveyFile({ fileUuid })
        archive.append(fileContentStream, { name: archiveEntryName })

        this.incrementProcessedItems()
      }
    }
  }
}
