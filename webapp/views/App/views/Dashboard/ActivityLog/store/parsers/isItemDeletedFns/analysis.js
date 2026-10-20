import * as A from '@core/arena'

import * as ActivityLog from '@common/activityLog/activityLog'
import * as Survey from '@core/survey/survey'

const _isChainDeleted = () => A.pipe(ActivityLog.getChainUuid, A.isNil)

const _isAnalysisNodeDefDeleted = (survey) => (activityLog) => {
  const nodeDefUuid = ActivityLog.getContentNodeDefUuid(activityLog)
  const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
  return !nodeDef || _isChainDeleted()(activityLog)
}

export default {
  [ActivityLog.type.chainCreate]: _isChainDeleted,
  [ActivityLog.type.chainPropUpdate]: _isChainDeleted,

  [ActivityLog.type.analysisNodeDefPropUpdate]: _isAnalysisNodeDefDeleted,

  [ActivityLog.type.chainStatusExecSuccess]: _isChainDeleted,
}
