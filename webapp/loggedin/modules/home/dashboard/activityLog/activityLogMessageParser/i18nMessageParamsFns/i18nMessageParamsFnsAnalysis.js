import * as R from 'ramda'

import * as ActivityLog from '@common/activityLog/activityLog'
import * as ProcessingStep from '@common/analysis/processingStep'

const _getProcessingChainLabel = lang =>
  R.pipe(ActivityLog.getProcessingChainLabels, R.prop(lang))

export default {

  [ActivityLog.type.processingChainPropUpdate]: (survey, i18n) => activityLog => ({
    key: ActivityLog.getContentKey(activityLog),
    label: _getProcessingChainLabel(i18n.lang)(activityLog)
  }),

  [ActivityLog.type.processingChainDelete]: (survey, i18n) => activityLog => ({
    label: R.pipe(ActivityLog.getContentLabels, R.prop(i18n.lang))(activityLog),
  }),

  [ActivityLog.type.processingStepCreate]: (survey, i18n) => activityLog => {
    const processingStep = ActivityLog.getContent(activityLog)
    return {
      index: ProcessingStep.getIndex(processingStep),
      processingChainLabel: _getProcessingChainLabel(i18n.lang)(activityLog)
    }
  },

  [ActivityLog.type.processingStepPropsUpdate]: (survey, i18n) => activityLog => ({
    index: ActivityLog.getProcessingStepIndex(activityLog),
    processingChainLabel: _getProcessingChainLabel(i18n.lang)(activityLog)
  }),

  [ActivityLog.type.processingStepDelete]: (survey, i18n) => activityLog => ({
    index: ActivityLog.getContentIndex(activityLog),
    processingChainLabel: _getProcessingChainLabel(i18n.lang)(activityLog)
  }),
}