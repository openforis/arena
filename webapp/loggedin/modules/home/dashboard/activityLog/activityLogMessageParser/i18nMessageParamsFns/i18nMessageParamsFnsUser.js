import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as AuthGroup from '@core/auth/authGroup'

import * as ActivityLog from '@common/activityLog/activityLog'

export default {

  [ActivityLog.type.userInvite]: (survey, i18n) => activityLog => {
    const groups = R.pipe(Survey.getSurveyInfo, Survey.getAuthGroups)(survey)
    const group = groups.find(group => AuthGroup.getUuid(group) === ActivityLog.getContentGroupUuid(activityLog))

    return {
      email: ActivityLog.getContentUserEmail(activityLog),
      groupName: i18n.t(`authGroups.${AuthGroup.getName(group)}.label`)
    }
  },

  [ActivityLog.type.userUpdate]: () => activityLog => ({
    name: ActivityLog.getContentUserName(activityLog)
  }),

  [ActivityLog.type.userRemove]: () => activityLog => ({
    name: ActivityLog.getContentUserName(activityLog)
  })

}