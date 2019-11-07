import * as ActivityLog from '@common/activityLog/activityLog'

const _isUserRemoved = () => ActivityLog.isTargetUserRemoved

export default {
  [ActivityLog.type.userInvite]: _isUserRemoved,

  [ActivityLog.type.userUpdate]: _isUserRemoved,
}
