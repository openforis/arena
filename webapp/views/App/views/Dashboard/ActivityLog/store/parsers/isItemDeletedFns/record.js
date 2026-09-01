import * as R from 'ramda'

import * as ActivityLog from '@common/activityLog/activityLog'

const _isRecordDeleted = R.pipe(ActivityLog.getRecordUuid, R.isNil)

export default {
  [ActivityLog.type.recordCreate]: () => _isRecordDeleted,

  [ActivityLog.type.recordStepUpdate]: () => _isRecordDeleted,
}
