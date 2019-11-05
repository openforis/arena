import * as ActivityLog from '@common/activityLog/activityLog'

export default {
  [ActivityLog.type.recordCreate]: () => activityLog =>
    ActivityLog.isRecordDeleted(activityLog),

  [ActivityLog.type.recordStepUpdate]: () => activityLog =>
    ActivityLog.isRecordDeleted(activityLog),
}
