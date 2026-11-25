import * as ActivityLog from '@common/activityLog/activityLog'
import * as A from '@core/arena'

const _isRecordDeleted = A.pipe(ActivityLog.getRecordUuid, A.isNil)

export default {
  [ActivityLog.type.recordCreate]: () => _isRecordDeleted,

  [ActivityLog.type.recordStepUpdate]: () => _isRecordDeleted,
}
