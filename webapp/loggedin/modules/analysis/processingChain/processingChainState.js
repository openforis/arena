import * as R from 'ramda'

import * as AnalysisState from '../analysisState'

export const stateKey = 'processingChain'

export const keys = {
  processingChain: 'processingChain'
}

export const getProcessingChain = R.pipe(
  AnalysisState.getState,
  R.prop(stateKey)
)
