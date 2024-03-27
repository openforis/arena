import * as R from 'ramda'

import * as ActivityLog from '@common/activityLog/activityLog'

import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'

const _getChainLabel = (lang) => R.pipe(ActivityLog.getChainLabels, R.prop(lang))

export default {
  // ====== Chain
  [ActivityLog.type.chainPropUpdate]: (survey, i18n) => (activityLog) => ({
    key: ActivityLog.getContentKey(activityLog),
    label: _getChainLabel(i18n.language)(activityLog),
  }),

  [ActivityLog.type.analysisNodeDefPropUpdate]: (survey) => (activityLog) => {
    const nodeDefUuid = ActivityLog.getContentNodeDefUuid(activityLog)
    const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
    return {
      key: ActivityLog.getContentKey(activityLog),
      value: ActivityLog.getContentValue(activityLog),
      name: NodeDef.getName(nodeDef),
    }
  },

  [ActivityLog.type.chainStatusExecSuccess]: (survey, i18n) => (activityLog) => ({
    label: _getChainLabel(i18n.language)(activityLog),
  }),

  [ActivityLog.type.chainDelete]: (survey, i18n) => (activityLog) => ({
    label: R.pipe(ActivityLog.getContentLabels, R.prop(i18n.language))(activityLog),
  }),
}
