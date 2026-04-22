import { Objects } from '@openforis/arena-core'

import * as SurveyFile from '@core/survey/surveyFile'

import Job from '@server/job/job'
import * as SurveyFileService from '@server/modules/survey/service/surveyFileService'
import { ExportFile } from '../exportFile'

export default class RecordFilesExportJob extends Job {
  constructor(params) {
    super('RecordFilesExportJob', params)
  }

  async execute() {
    const { archive, surveyId, recordUuids } = this.context

    const filesSummaries = await SurveyFileService.fetchFileSummariesBySurveyId(surveyId, this.tx)
    const filesSummariesIncluded = filesSummaries.filter((fileSummary) => {
      const type = SurveyFile.getType(fileSummary)
      if (type !== SurveyFile.SurveyFileType.recordAttachment) {
        return false
      }
      return Objects.isEmpty(recordUuids) || recordUuids.includes(SurveyFile.getRecordUuid(fileSummary))
    })

    const filesCount = filesSummariesIncluded.length
    this.total = filesCount

    this.logDebug(`file(s) to export: ${filesCount}`)

    if (filesCount > 0) {
      archive.append(JSON.stringify(filesSummariesIncluded, null, 2), { name: ExportFile.filesSummaries })

      // write each file content into a separate binary file
      for (const fileSummary of filesSummariesIncluded) {
        if (this.isCanceled()) {
          break
        }
        const fileUuid = SurveyFile.getUuid(fileSummary)
        const fileContentStream = await SurveyFileService.fetchFileContentAsStream({ surveyId, fileUuid }, this.tx)
        archive.append(fileContentStream, { name: ExportFile.file({ fileUuid }) })
        this.incrementProcessedItems()
      }
    }
  }
}
