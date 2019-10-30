import * as R from 'ramda'

import * as ProcessingStep from '@common/analysis/processingStep'

import * as AnalysisState from '@webapp/loggedin/modules/analysis/analysisState'

export const stateKey = 'processingStep'

export const getProcessingStep = R.pipe(
  AnalysisState.getState,
  R.prop(stateKey)
)

export const mergeProcessingStepProps = props => processingStepState => {
  const propsUpdate = R.pipe(ProcessingStep.getProps, R.mergeLeft(props))(processingStepState)
  return R.assoc(ProcessingStep.keys.props, propsUpdate)(processingStepState)
}