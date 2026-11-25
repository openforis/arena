import * as ActivityLog from '@common/activityLog/activityLog'
import Job, { type JobParams } from '@server/job/job'
import * as ActivityLogManager from '@server/modules/activityLog/manager/activityLogManager'

import DataDeleteJob from './jobs/dataDeleteJob'
import SurveyPropsUnpublishPublishJob from './jobs/surveyPropsUnpublishJob'

export default class SurveyUnpublishJob extends Job {
  static readonly type: string = 'SurveyUnpublishJob'

  constructor(params?: Partial<JobParams>) {
    super(SurveyUnpublishJob.type, params, [new SurveyPropsUnpublishPublishJob(), new DataDeleteJob()])
  }

  async onStart() {
    await super.onStart()

    await ActivityLogManager.insert(this.user, this.surveyId, ActivityLog.type.surveyUnpublish, null, false, this.tx)
  }
}
