import * as R from 'ramda'

import * as ActivityLog from '@common/activityLog/activityLog'

const _isProcessingChainDeleted = () => R.pipe(ActivityLog.getProcessingChainLabels, R.isNil)
const _isProcessingStepDeleted = () => R.pipe(ActivityLog.getProcessingStepIndex, R.isNil)

export default {
  [ActivityLog.type.processingChainCreate]: _isProcessingChainDeleted,

  [ActivityLog.type.processingChainPropUpdate]: _isProcessingChainDeleted,

  [ActivityLog.type.processingStepCreate]: _isProcessingStepDeleted,

  [ActivityLog.type.processingStepPropsUpdate]: _isProcessingStepDeleted,

  [ActivityLog.type.processingStepDelete]: _isProcessingChainDeleted,
}
