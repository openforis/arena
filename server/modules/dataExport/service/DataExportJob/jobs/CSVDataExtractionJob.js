import Job from '@server/job/job'

import * as SurveyRdbService from '@server/modules/surveyRdb/service/surveyRdbService'

export default class CSVDataExtractionJob extends Job {
  constructor(params) {
    super('CSVDataExtraction', params)
  }

  async execute() {
    const { survey, cycle, recordUuids, search, options, outputDir } = this.context

    await SurveyRdbService.fetchEntitiesDataToCsvFiles(
      {
        user: this.user,
        survey,
        cycle,
        recordUuids,
        search,
        options,
        outputDir,
        callback: ({ total }) => {
          this.total = total
          this.incrementProcessedItems()
        },
      },
      this.tx
    )
  }
}
