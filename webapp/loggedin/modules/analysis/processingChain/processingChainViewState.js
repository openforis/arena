import * as R from 'ramda'

import ObjectUtils from '../../../../../common/objectUtils'

import * as AnalysisState from '../analysisState'

export const stateKey = 'processingChainView'

export const keys = {
  processingChain: 'processingChain'
}

export const getState = R.pipe(
  AnalysisState.getState,
  R.prop(stateKey)
)

export const getProcessingChain = R.pipe(
  getState,
  R.prop(keys.processingChain)
)

export const assocProcessingChain = R.assoc(keys.processingChain)
export const assocProcessingChainProp = (key, value) => R.assocPath([keys.processingChain, ObjectUtils.keys.props, key], value)