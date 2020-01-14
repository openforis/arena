import * as R from 'ramda'

import * as ProcessingChain from '@common/analysis/processingChain'

import * as AnalysisState from '@webapp/loggedin/modules/analysis/analysisState'

export const stateKey = 'processingChain'

const keys = {
  dirty: 'dirty',
  orig: 'orig',
}

export const getState = R.pipe(AnalysisState.getState, R.prop(stateKey))

// ====== READ

const getProcessingChainOrig = R.pipe(getState, R.propOr({}, keys.orig))

export const getProcessingChain = R.pipe(getState, R.propOr({}, keys.dirty))

// ====== UPDATE

export const assocProcessingChain = chain => R.pipe(R.assoc(keys.orig, chain), R.assoc(keys.dirty, chain))

const _assocProcessingChainProp = (key, fn) => state =>
  R.pipe(R.prop(key), fn, chainUpdated => R.assoc(key, chainUpdated)(state))(state)

const _assocProcessingChainPropOrig = fn => _assocProcessingChainProp(keys.orig, fn)

const _assocProcessingChainPropDirty = fn => _assocProcessingChainProp(keys.dirty, fn)

export const assocPropDirty = (key, value) => _assocProcessingChainPropDirty(ProcessingChain.assocProp(key, value))

export const assocProcessingSteps = steps =>
  R.pipe(
    _assocProcessingChainPropDirty(ProcessingChain.assocProcessingSteps(steps)),
    _assocProcessingChainPropOrig(ProcessingChain.assocProcessingSteps(steps)),
  )

export const mergeDirty = state => {
  const chainDirty = R.prop(keys.dirty, state)
  return R.assoc(keys.orig, chainDirty, state)
}

// ====== UTILS

export const isDirty = state => {
  const chainDirty = getProcessingChain(state)
  return ProcessingChain.isTemporary(chainDirty) || !R.equals(chainDirty, getProcessingChainOrig(state))
}

export const isEditingChain = R.pipe(getProcessingChain, R.isEmpty, R.not)
