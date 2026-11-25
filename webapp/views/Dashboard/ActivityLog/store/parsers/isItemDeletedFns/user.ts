import * as A from '@core/arena'

import * as ActivityLog from '@common/activityLog/activityLog'

const _isUserRemoved = () => A.pipe(ActivityLog.getTargetUserUuid, A.isNil)

export default {
  [ActivityLog.type.userInvite]: _isUserRemoved,

  [ActivityLog.type.userUpdate]: _isUserRemoved,
}
