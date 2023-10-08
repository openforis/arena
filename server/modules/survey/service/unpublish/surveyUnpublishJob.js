import * as ActivityLog from '@common/activityLog/activityLog'

import Job from '@server/job/job'
import * as ActivityLogManager from '@server/modules/activityLog/manager/activityLogManager'

import SurveyPropsUnpublishPublishJob from './jobs/surveyPropsUnpublishJob'
import DataDeleteJob from './jobs/dataDeleteJob'

export default class SurveyUnpublishJob extends Job {
  constructor(params) {
    super(SurveyUnpublishJob.type, params, [new SurveyPropsUnpublishPublishJob(), new DataDeleteJob()])
  }

  async onStart() {
    await super.onStart()

    await ActivityLogManager.insert(this.user, this.surveyId, ActivityLog.type.surveyUnpublish, null, false, this.tx)
  }
}

SurveyUnpublishJob.type = 'SurveyUnpublishJob'
