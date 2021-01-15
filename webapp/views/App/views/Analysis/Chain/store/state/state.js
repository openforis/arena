import * as R from 'ramda'

import * as A from '@core/arena'

import * as Chain from '@common/analysis/processingChain'
import * as Step from '@common/analysis/processingStep'
import * as Calculation from '@common/analysis/processingStepCalculation'

export const keys = {
  attributeUuidsOtherChains: 'attributeUuidsOtherChains',
  chain: 'chain',
  chainEdit: 'chainEdit',
  step: 'step',
  stepEdit: 'stepEdit',
  variablePrevStepEdit: 'variablePrevStepEdit',
  variablePrevStepUuidHighlighted: 'variablePrevStepUuidHighlighted',
  calculation: 'calculation',
  calculationEdit: 'calculationEdit',
}

// ==== CREATE
export const create = ({ chain, step = null, calculation = null, attributeUuidsOtherChains }) => ({
  [keys.attributeUuidsOtherChains]: attributeUuidsOtherChains,
  [keys.chain]: chain,
  [keys.chainEdit]: chain,
  [keys.step]: step,
  [keys.stepEdit]: step,
  [keys.calculation]: calculation,
  [keys.calculationEdit]: calculation,
})

// ==== READ
export const getAttributeUuidsOtherChains = A.prop(keys.attributeUuidsOtherChains)

export const getChain = A.prop(keys.chain)
export const getChainEdit = A.prop(keys.chainEdit)
export const isChainDirty = (state) =>
  Chain.isTemporary(getChain(state)) || !R.equals(getChain(state))(getChainEdit(state))

export const getStep = A.prop(keys.step)
export const getStepEdit = A.prop(keys.stepEdit)
export const isStepDirty = (state) => Step.isTemporary(getStep(state)) || !R.equals(getStep(state))(getStepEdit(state))

export const getVariablePrevStepEdit = A.prop(keys.variablePrevStepEdit)
export const getVariablePrevStepUuidHighlighted = A.prop(keys.variablePrevStepUuidHighlighted)

export const getCalculation = A.prop(keys.calculation)
export const getCalculationEdit = A.prop(keys.calculationEdit)
export const isCalculationDirty = (state) =>
  Calculation.isTemporary(getCalculation(state)) || !R.equals(getCalculation(state))(getCalculationEdit(state))

export const isDirty = (state) => isChainDirty(state) || isStepDirty(state) || isCalculationDirty(state)

export const isEditingCalculation = (state) => Boolean(getCalculationEdit(state))
export const isEditingStep = (state) => Boolean(getStepEdit(state))
export const isEditingChain = (state) => Boolean(getChainEdit(state))

// ==== UPDATE
export const assocChain = A.assoc(keys.chain)
export const assocChainEdit = A.assoc(keys.chainEdit)

export const assocStep = A.assoc(keys.step)
export const assocStepEdit = A.assoc(keys.stepEdit)
export const assocVariablePrevStepEdit = A.assoc(keys.variablePrevStepEdit)
export const dissocVariablePrevStepEdit = A.dissoc(keys.variablePrevStepEdit)
export const assocVariablePrevStepUuidHighlighted = A.assoc(keys.variablePrevStepUuidHighlighted)
export const dissocVariablePrevStepUuidHighlighted = A.dissoc(keys.variablePrevStepUuidHighlighted)

export const assocCalculation = A.assoc(keys.calculation)
export const assocCalculationEdit = A.assoc(keys.calculationEdit)

// ==== Delete

export const dissocStep = A.dissoc(keys.step)
export const dissocStepEdit = A.dissoc(keys.stepEdit)

export const dissocCalculation = A.dissoc(keys.calculation)
export const dissocCalculationEdit = A.dissoc(keys.calculationEdit)
