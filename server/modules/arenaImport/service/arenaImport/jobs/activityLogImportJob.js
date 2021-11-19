import * as PromiseUtils from '@core/promiseUtils'

import Job from '@server/job/job'
import * as ActivityLogManager from '@server/modules/activityLog/manager/activityLogManager'
import * as ArenaSurveyFileZip from '@server/modules/arenaImport/service/arenaImport/model/arenaSurveyFileZip'

export default class ActivityLogImportJob extends Job {
  constructor(params) {
    super('ActivityLogImportJob', params)
  }

  async execute() {
    const { arenaSurveyFileZip, surveyId } = this.context

    this.total = ArenaSurveyFileZip.getActivitiesFilesCount(arenaSurveyFileZip)

    if (this.total > 0) {
      await PromiseUtils.each([...Array(this.total).keys()], async (index) => {
        const activities = await ArenaSurveyFileZip.getActivities(arenaSurveyFileZip, index)
        await ActivityLogManager.insertMany(this.user, surveyId, activities, this.tx)
        this.incrementProcessedItems()
      })
    }
  }
}
