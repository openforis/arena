import * as R from 'ramda'

import * as ActivityLog from '@common/activityLog/activityLog'

const _isUserDeleted = () => R.pipe(ActivityLog.getContentUserEmail, R.isNil)

export default {
  [ActivityLog.type.userInvite]: _isUserDeleted,

  [ActivityLog.type.userUpdate]: _isUserDeleted,
}
