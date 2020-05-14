import * as R from 'ramda'

import * as ProcessingChain from '@common/analysis/processingChain'

import * as AnalysisState from '@webapp/loggedin/modules/analysis/analysisState'

export const stateKey = 'processingChain'

const keys = {
  dirty: 'dirty',
  orig: 'orig',
  attributeUuidsOtherChains: 'attributeUuidsOtherChains',
}

export const getState = R.pipe(AnalysisState.getState, R.prop(stateKey))

// ====== READ

const _getStateProp = (key, defaultValue = null) => R.pipe(getState, R.propOr(defaultValue, key))

const getProcessingChainOrig = _getStateProp(keys.orig, {})

export const getProcessingChain = _getStateProp(keys.dirty, {})

export const getAttributeUuidsOtherChains = _getStateProp(keys.attributeUuidsOtherChains, [])

// ====== UPDATE

const _assocChain = (chain) => R.pipe(R.assoc(keys.orig, chain), R.assoc(keys.dirty, chain))

export const initProcessingChain = (chain, attributeUuidsOtherChains) =>
  R.pipe(_assocChain(chain), R.assoc(keys.attributeUuidsOtherChains, attributeUuidsOtherChains))

const _updateChainDirty = (fn) => (state) =>
  R.pipe(R.prop(keys.dirty), fn, (chainUpdated) => R.assoc(keys.dirty, chainUpdated)(state))(state)

export const assocPropDirty = (key, value) => _updateChainDirty(ProcessingChain.assocProp(key, value))

export const assocProcessingChainValidation = (validation) =>
  _updateChainDirty(ProcessingChain.assocValidation(validation))

export const appendProcessingStep = (step) => _updateChainDirty(ProcessingChain.assocProcessingStep(step))

export const dissocStepTemporary = _updateChainDirty(ProcessingChain.dissocProcessingStepTemporary)

export const dissocStepLast = _updateChainDirty(ProcessingChain.dissocProcessingStepLast)

export const saveDirty = (chain, step) => (state) =>
  R.pipe(R.when(R.always(Boolean(step)), ProcessingChain.assocProcessingStep(step)), (chainUpdate) =>
    _assocChain(chainUpdate)(state)
  )(chain)

// ====== UTILS

export const isDirty = (state) => {
  const chainDirty = getProcessingChain(state)
  return ProcessingChain.isTemporary(chainDirty) || !R.equals(chainDirty, getProcessingChainOrig(state))
}

export const isEditingChain = R.pipe(getProcessingChain, R.isEmpty, R.not)
