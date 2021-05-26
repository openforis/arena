import Job from '@server/job/job'

import * as SurveyRdbManager from '@server/modules/surveyRdb/manager/surveyRdbManager'

export default class CSVDataExtraction extends Job {
  constructor(params) {
    super('CSVDataExtraction', params)
  }

  async execute() {
    const { surveyId } = this.context

    const { exportDataFolderName, dir } = await SurveyRdbManager.fetchEntitiesDataToCsvFiles(
      {
        surveyId,
        callback: ({ total }) => {
          this.total = total
          this.incrementProcessedItems()
        },
      },
      this.tx
    )

    this.setContext({ dir, exportDataFolderName })
  }
}
