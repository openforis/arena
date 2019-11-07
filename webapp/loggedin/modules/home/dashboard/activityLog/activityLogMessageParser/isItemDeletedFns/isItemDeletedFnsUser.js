import * as R from 'ramda'

import * as ActivityLog from '@common/activityLog/activityLog'

const _isUserDeletedFromSurvey = () => R.pipe(ActivityLog.getContentUserCanAccessSurvey, R.not)

export default {
  [ActivityLog.type.userInvite]: _isUserDeletedFromSurvey,

  [ActivityLog.type.userUpdate]: _isUserDeletedFromSurvey,
}
