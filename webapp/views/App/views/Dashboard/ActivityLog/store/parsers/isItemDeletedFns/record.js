import * as A from '@core/arena'

import * as ActivityLog from '@common/activityLog/activityLog'

const _isRecordDeleted = A.pipe(ActivityLog.getRecordUuid, A.isNil)

export default {
  [ActivityLog.type.recordCreate]: () => _isRecordDeleted,

  [ActivityLog.type.recordStepUpdate]: () => _isRecordDeleted,
}
