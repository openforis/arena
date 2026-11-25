import * as ActivityLog from '@common/activityLog/activityLog'

export default {
  [ActivityLog.type.recordDelete]: () => (activityLog) => ({
    keys: ActivityLog.getContentKeys(activityLog),
  }),

  [ActivityLog.type.recordStepUpdate]: () => (activityLog) => ({
    keys: ActivityLog.getContentKeys(activityLog),
    stepFrom: ActivityLog.getContentStepFrom(activityLog),
    stepTo: ActivityLog.getContentStepTo(activityLog),
  }),
}
