import * as A from '@core/arena'

import * as Survey from '@core/survey/survey'
import * as AuthGroup from '@core/auth/authGroup'

import * as ActivityLog from '@common/activityLog/activityLog'

export default {
  [ActivityLog.type.userInvite]: (survey, i18n) => (activityLog) => {
    const groupUuid = ActivityLog.getContentGroupUuid(activityLog)
    const groupName = A.pipe(
      Survey.getSurveyInfo,
      Survey.getAuthGroups,
      A.find((authGroup) => AuthGroup.getUuid(authGroup) === groupUuid),
      AuthGroup.getName,
      A.defaultTo(AuthGroup.groupNames.systemAdmin)
    )(survey)

    return {
      email: ActivityLog.getTargetUserEmail(activityLog),
      groupName: i18n.t(`auth:authGroups.${groupName}.label`),
    }
  },

  [ActivityLog.type.userUpdate]: () => (activityLog) => ({
    name: ActivityLog.getTargetUserName(activityLog),
  }),

  [ActivityLog.type.userRemove]: () => (activityLog) => ({
    name: ActivityLog.getTargetUserName(activityLog),
  }),
}
