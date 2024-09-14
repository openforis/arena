import Job from '@server/job/job'

import * as SurveyRdbService from '@server/modules/surveyRdb/service/surveyRdbService'

export default class CSVDataExtractionJob extends Job {
  constructor(params) {
    super('CSVDataExtraction', params)
  }

  async execute() {
    const {
      survey,
      cycle,
      recordUuids,
      search,
      includeCategoryItemsLabels,
      expandCategoryItems,
      includeAncestorAttributes,
      includeAnalysis,
      includeDataFromAllCycles,
      includeFiles,
      recordsModifiedAfter,
      outputDir,
    } = this.context

    const { fileNamesByFileUuid } = await SurveyRdbService.fetchEntitiesDataToCsvFiles(
      {
        user: this.user,
        survey,
        cycle,
        recordUuids,
        search,
        includeCategoryItemsLabels,
        expandCategoryItems,
        includeAncestorAttributes,
        includeAnalysis,
        includeDataFromAllCycles,
        includeFiles,
        recordsModifiedAfter,
        outputDir,
        callback: ({ total }) => {
          this.total = total
          this.incrementProcessedItems()
        },
      },
      this.tx
    )
    this.setContext({ fileNamesByFileUuid })
  }
}
