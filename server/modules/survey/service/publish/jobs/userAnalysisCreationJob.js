import Job from '@server/job/job'

import * as UserAnalysisManager from '@server/modules/user/manager/userAnalysisManager'

export default class UserAnalysisCreationJob extends Job {
  constructor(params) {
    super(UserAnalysisCreationJob.type, params)
  }

  async execute() {
    await UserAnalysisManager.insertUserAnalysis(this.surveyId, this.tx)
  }
}

UserAnalysisCreationJob.type = 'UserAnalysisCreationJob'
