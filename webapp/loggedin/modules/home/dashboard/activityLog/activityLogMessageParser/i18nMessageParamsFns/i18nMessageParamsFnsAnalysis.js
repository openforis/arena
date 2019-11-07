import * as R from 'ramda'

import * as ActivityLog from '@common/activityLog/activityLog'

export default {

  [ActivityLog.type.processingChainPropUpdate]: (survey, i18n) => activityLog => ({
    key: ActivityLog.getContentKey(activityLog),
    label: R.pipe(ActivityLog.getProcessingChainLabels, R.prop(i18n.lang))(activityLog),
  }),

  [ActivityLog.type.processingChainDelete]: (survey, i18n) => activityLog => ({
    label: R.pipe(ActivityLog.getContentLabels, R.prop(i18n.lang))(activityLog),
  }),

  [ActivityLog.type.processingStepCreate]:  (survey, i18n) => activityLog => ({
    index:
    processingChainLabel: R.pipe(ActivityLog.getContentLabels, R.prop(i18n.lang))(activityLog),
  }),

}