import * as R from 'ramda'

import * as ActivityLog from '@common/activityLog/activityLog'

const _isProcessingChainDeleted = () => R.pipe(ActivityLog.getChainUuid, R.isNil)
const _isProcessingStepDeleted = () => R.pipe(ActivityLog.getProcessingStepIndex, R.isNil)
const _isProcessingStepCalculationDeleted = () => R.pipe(ActivityLog.getProcessingStepCalculationIndex, R.isNil)

export default {
  [ActivityLog.type.chainCreate]: _isProcessingChainDeleted,

  [ActivityLog.type.chainPropUpdate]: _isProcessingChainDeleted,

  [ActivityLog.type.processingChainStatusExecSuccess]: _isProcessingChainDeleted,

  [ActivityLog.type.processingStepCreate]: _isProcessingStepDeleted,

  [ActivityLog.type.processingStepPropUpdate]: _isProcessingStepDeleted,

  [ActivityLog.type.processingStepDelete]: _isProcessingChainDeleted,

  [ActivityLog.type.processingStepCalculationCreate]: _isProcessingStepCalculationDeleted,

  [ActivityLog.type.processingStepCalculationIndexUpdate]: _isProcessingStepCalculationDeleted,

  [ActivityLog.type.processingStepCalculationUpdate]: _isProcessingStepCalculationDeleted,
}
