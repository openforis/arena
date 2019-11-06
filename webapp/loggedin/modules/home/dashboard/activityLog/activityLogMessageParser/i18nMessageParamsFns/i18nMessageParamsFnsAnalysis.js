import * as ActivityLog from '@common/activityLog/activityLog'

export default {

  [ActivityLog.type.processingChainPropUpdate]: (survey, i18n) => activityLog => ({
    key: ActivityLog.getContentKey(activityLog),
    label: ActivityLog.getContentLabels(activityLog)[i18n.lang],
  }),

}