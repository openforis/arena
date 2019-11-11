import * as R from 'ramda'

import * as ActivityLog from '@common/activityLog/activityLog'

const _isUserRemoved = () => R.pipe(ActivityLog.getTargetUserUuid, R.isNil)

export default {
  [ActivityLog.type.userInvite]: _isUserRemoved,

  [ActivityLog.type.userUpdate]: _isUserRemoved,
}
