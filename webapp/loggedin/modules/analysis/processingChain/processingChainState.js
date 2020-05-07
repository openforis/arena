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

const _updateChain = (key, fn) => (state) =>
  R.pipe(R.prop(key), fn, (chainUpdated) => R.assoc(key, chainUpdated)(state))(state)

const _updateChainOrig = (fn) => _updateChain(keys.orig, fn)

const _updateChainDirty = (fn) => _updateChain(keys.dirty, fn)

export const assocPropDirty = (key, value) => _updateChainDirty(ProcessingChain.assocProp(key, value))

export const assocProcessingChainValidation = (validation) =>
  _updateChainDirty(ProcessingChain.assocValidation(validation))

export const assocProcessingSteps = (steps) =>
  R.pipe(
    _updateChainDirty(ProcessingChain.assocProcessingSteps(steps)),
    _updateChainOrig(ProcessingChain.assocProcessingSteps(steps))
  )

export const appendProcessingStep = (step) => _updateChainDirty(ProcessingChain.assocProcessingStep(step))

export const dissocStepTemporary = _updateChainDirty(ProcessingChain.dissocProcessingStepTemporary)

export const dissocStepLast = _updateChainDirty(ProcessingChain.dissocProcessingStepLast)

export const assocProcessingStepCalculationAttributeUuid = (calculationUuid, attributeDefUuid) =>
  _updateChainDirty(ProcessingChain.assocCalculationAttributeDefUuid(calculationUuid, attributeDefUuid))

export const dissocProcessingStepCalculationAttributeUuid = (calculationUuid) =>
  _updateChainDirty(ProcessingChain.dissocCalculationAttributeDefUuid(calculationUuid))

export const resetProcessingStepCalculationAttributeUuid = (calculationUuid) => (state) =>
  R.pipe(
    // Get original calculation attribute def uuid
    R.prop(keys.orig),
    ProcessingChain.getCalculationAttributeUuidByCalculationUuid(calculationUuid),
    // Assoc original calculation attribute def uuid to dirty processing chain
    (attributeDefUuidOrig) => assocProcessingStepCalculationAttributeUuid(calculationUuid, attributeDefUuidOrig)(state)
  )(state)

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
