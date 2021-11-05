import Job from '@server/job/job'
import * as ActivityLogManager from '@server/modules/activityLog/manager/activityLogManager'
import * as ArenaSurveyFileZip from '@server/modules/arenaImport/service/arenaImport/model/arenaSurveyFileZip'

export default class ActivityLogImportJob extends Job {
  constructor(params) {
    super('ActivityLogImportJob', params)
  }

  async execute() {
    const { arenaSurveyFileZip, surveyId } = this.context

    // TODO process activities with a stream
    const activities = await ArenaSurveyFileZip.getActivities(arenaSurveyFileZip)
    if (activities.length > 0) {
      await ActivityLogManager.insertMany(this.user, surveyId, activities, this.tx)
    }
  }
}
