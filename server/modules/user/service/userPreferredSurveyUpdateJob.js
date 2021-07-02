import Job from '@server/job/job'

import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'

import * as UserService from '@server/modules/user/service/userService'

export default class UserPreferredSurveyUpdateJob extends Job {
  constructor(params) {
    super(UserPreferredSurveyUpdateJob.type, params)
  }

  async execute() {
    const { surveyId } = this.context
    if (surveyId) {
      const userUpdated = User.assocPrefSurveyCurrentAndCycle(surveyId, Survey.cycleOneKey)(this.user)
      await UserService.updateUserPrefs(userUpdated, this.tx)
    }
  }
}

UserPreferredSurveyUpdateJob.type = 'UserPreferredSurveyUpdateJob'
