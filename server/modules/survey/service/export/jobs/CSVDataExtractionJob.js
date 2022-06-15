import Job from '@server/job/job'

import * as SurveyRdbManager from '@server/modules/surveyRdb/manager/surveyRdbManager'

export default class CSVDataExtractionJob extends Job {
  constructor(params) {
    super('CSVDataExtraction', params)
  }

  async execute() {
    const { surveyId, includeCategoryItemsLabels, includeAnalysis, outputDir } = this.context

    await SurveyRdbManager.fetchEntitiesDataToCsvFiles(
      {
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
