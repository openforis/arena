import Job from '@server/job/job'

import * as SurveyRdbManager from '@server/modules/surveyRdb/manager/surveyRdbManager'
import { jobEvents } from '@server/job/jobUtils'

export default class CSVDataExtraction extends Job {
  constructor(params) {
    super('CSVDataExtraction', params)
  }

  async execute() {
    const { surveyId } = this.context

    const { exportDataFolderName, dir } = await SurveyRdbManager.fetchEntitiesDataToCsvFiles(
      {
        surveyId,
        callback: (result) => {
          this.setResult(result)
          const event = this._createJobEvent(jobEvents.statusChange)
          this._notifyEvent(event)
        },
      },
      this.tx
    )

    this.setContext({ dir, exportDataFolderName })
  }
}
