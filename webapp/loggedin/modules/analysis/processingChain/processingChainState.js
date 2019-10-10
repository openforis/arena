import * as R from 'ramda'

import ProcessingChain from '../../../../../common/analysis/processingChain'

import * as AnalysisState from '../analysisState'

export const stateKey = 'processingChain'

export const keys = {
  processingChain: 'processingChain'
}

export const getProcessingChain = R.pipe(
  AnalysisState.getState,
  R.prop(stateKey)
)

export const assocProcessingChain = processingChain => () => processingChain
export const assocProcessingChainProp = (key, value) => ProcessingChain.assocProp(key, value)