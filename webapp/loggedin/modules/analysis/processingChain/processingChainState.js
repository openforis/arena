import * as R from 'ramda'

import * as ProcessingChain from '@common/analysis/processingChain'
import * as ProcessingStep from '@common/analysis/processingStep'

import * as AnalysisState from '@webapp/loggedin/modules/analysis/analysisState'

export const stateKey = 'processingChain'

const keys = {
  dirty: 'dirty',
  orig: 'orig',
  stepUuidForEdit: 'stepUuidForEdit',
}

export const getState = R.pipe(AnalysisState.getState, R.prop(stateKey))

// ====== READ

const _getStateProp = (key, defaultValue = null) => R.pipe(getState, R.propOr(defaultValue, key))

const getProcessingChainOrig = _getStateProp(keys.orig, {})

export const getProcessingChain = _getStateProp(keys.dirty, {})

export const getProcessingStepForEdit = state =>
  R.pipe(
    _getStateProp(keys.stepUuidForEdit),
    R.unless(R.isNil, uuid =>
      R.pipe(
        getProcessingChain,
        ProcessingChain.getProcessingSteps,
        R.find(R.propEq(ProcessingStep.keys.uuid, uuid)),
      )(state),
    ),
  )(state)

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

export const assocProcessingStepUuidForEdit = R.assoc(keys.stepUuidForEdit)

// ====== UTILS

export const isDirty = state => {
  const chainDirty = getProcessingChain(state)
  return ProcessingChain.isTemporary(chainDirty) || !R.equals(chainDirty, getProcessingChainOrig(state))
}

export const isEditingChain = R.pipe(getProcessingChain, R.isEmpty, R.not)
