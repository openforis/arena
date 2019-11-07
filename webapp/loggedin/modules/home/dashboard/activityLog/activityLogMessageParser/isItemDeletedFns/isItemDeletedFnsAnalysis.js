import * as R from 'ramda'

import * as ActivityLog from '@common/activityLog/activityLog'

const _isProcessingChainDeleted = () => R.pipe(ActivityLog.getProcessingChainLabels, R.isNil)

export default {
  [ActivityLog.type.processingChainCreate]: _isProcessingChainDeleted,

  [ActivityLog.type.processingChainPropUpdate]: _isProcessingChainDeleted,
}
