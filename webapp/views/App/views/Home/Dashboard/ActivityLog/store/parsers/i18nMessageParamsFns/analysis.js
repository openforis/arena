import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as ActivityLog from '@common/activityLog/activityLog'

const _getProcessingChainLabel = (lang) => R.pipe(ActivityLog.getProcessingChainLabels, R.prop(lang))

export default {
  // ====== Chain
  [ActivityLog.type.chainPropUpdate]: (survey, i18n) => (activityLog) => ({
    key: ActivityLog.getContentKey(activityLog),
    label: _getProcessingChainLabel(i18n.lang)(activityLog),
  }),

  [ActivityLog.type.chainNodeDefCreate]: (survey) => (activityLog) => {
    const nodeDefUuid = ActivityLog.getContentNodeDefUuid(activityLog)
    const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
    const nodeDefParent = Survey.getNodeDefParent(nodeDef)(survey)
    return {
      type: NodeDef.getType(nodeDef),
      parentName: NodeDef.getName(nodeDefParent),
    }
  },

  [ActivityLog.type.chainNodeDefPropUpdate]: (survey) => (activityLog) => {
    const nodeDefUuid = ActivityLog.getContentNodeDefUuid(activityLog)
    const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
    return {
      key: ActivityLog.getContentKey(activityLog),
      value: ActivityLog.getContentValue(activityLog),
      name: NodeDef.getName(nodeDef),
    }
  },

  [ActivityLog.type.processingChainStatusExecSuccess]: (survey, i18n) => (activityLog) => ({
    label: _getProcessingChainLabel(i18n.lang)(activityLog),
  }),

  [ActivityLog.type.processingChainDelete]: (survey, i18n) => (activityLog) => ({
    label: R.pipe(ActivityLog.getContentLabels, R.prop(i18n.lang))(activityLog),
  }),
}
