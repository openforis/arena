import { Objects } from '@openforis/arena-core'

import * as RecordFile from '@core/record/recordFile'

import Job from '@server/job/job'
import * as FileService from '@server/modules/record/service/fileService'
import { ExportFile } from '../exportFile'

export default class FilesExportJob extends Job {
  constructor(params) {
    super('FilesExportJob', params)
  }

  async execute() {
    const { archive, surveyId, recordUuids } = this.context

    const filesSummaries = await FileService.fetchFileSummariesBySurveyId(surveyId, this.tx)
    const filesSummariesIncluded = Objects.isEmpty(recordUuids)
      ? filesSummaries
      : filesSummaries.filter((fileSummary) => recordUuids.includes(RecordFile.getRecordUuid(fileSummary)))

    const filesCount = filesSummariesIncluded.length
    this.total = filesCount

    this.logDebug(`file(s) to export: ${filesCount}`)

    if (filesCount > 0) {
      archive.append(JSON.stringify(filesSummariesIncluded, null, 2), { name: ExportFile.filesSummaries })

      // write each file content into a separate binary file
      for await (const fileSummary of filesSummariesIncluded) {
        const fileUuid = RecordFile.getUuid(fileSummary)
        const fileContentStream = await FileService.fetchFileContentAsStream({ surveyId, fileUuid }, this.tx)
        archive.append(fileContentStream, { name: ExportFile.file({ fileUuid }) })
        this.incrementProcessedItems()
      }
    }
  }
}
