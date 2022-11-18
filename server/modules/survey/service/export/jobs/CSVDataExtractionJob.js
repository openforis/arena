import Job from '@server/job/job'

import * as SurveyRdbService from '@server/modules/surveyRdb/service/surveyRdbService'

export default class CSVDataExtractionJob extends Job {
  constructor(params) {
    super('CSVDataExtraction', params)
  }

  async execute() {
    const { surveyId, includeCategoryItemsLabels, includeAnalysis, outputDir } = this.context

    await SurveyRdbService.fetchEntitiesDataToCsvFiles(
      {
        user: this.user,
        surveyId,
        outputDir,
        includeCategoryItemsLabels,
        includeAnalysis,
        callback: ({ total }) => {
          this.total = total
          this.incrementProcessedItems()
        },
      },
      this.tx
    )
  }
}
