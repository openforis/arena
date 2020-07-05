import * as A from '@core/arena'

export const keys = {
  attributeUuidsOtherChains: 'attributeUuidsOtherChains',
  chain: 'chain',
  chainEdit: 'chainEdit',
  step: 'step',
  stepEdit: 'stepEdit',
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
export const isChainDirty = (state) => getChain(state) !== getChainEdit(state)

export const getStep = A.prop(keys.step)
export const getStepEdit = A.prop(keys.stepEdit)
export const isStepDirty = (state) => getStep(state) !== getStepEdit(state)

export const getCalculation = A.prop(keys.calculation)
export const getCalculationEdit = A.prop(keys.calculationEdit)
export const isCalculationDirty = (state) => getCalculation(state) !== getCalculationEdit(state)

// ==== UPDATE
export const assocChain = A.assoc(keys.chain)
export const assocChainEdit = A.assoc(keys.chainEdit)

export const assocStep = A.assoc(keys.step)
export const assocStepEdit = A.assoc(keys.stepEdit)

export const assocCalculation = A.assoc(keys.calculation)
export const assocCalculationEdit = A.assoc(keys.calculationEdit)

// ==== Delete

export const dissocStep = A.dissoc(keys.step)
export const dissocStepEdit = A.dissoc(keys.stepEdit)

export const dissocCalculation = A.dissoc(keys.calculation)
export const dissocCalculationEdit = A.dissoc(keys.calculationEdit)
