import * as A from '@core/arena'

export const keys = {
  attributeUuidsOtherChains: 'attributeUuidsOtherChains',
  chain: 'chain',
  chainEdit: 'chainEdit',
  step: 'step',
  stepEdit: 'stepDirty',
  calculation: 'calculation',
  calculationEdit: 'calculationDirty',
}

// ==== CREATE
export const create = ({ chain, attributeUuidsOtherChains }) => ({
  [keys.attributeUuidsOtherChains]: attributeUuidsOtherChains,
  [keys.chain]: chain,
  [keys.chainEdit]: chain,
  [keys.step]: null,
  [keys.stepEdit]: null,
  [keys.calculation]: null,
  [keys.calculationEdit]: null,
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

// ==== READ
export const assocChainEdit = A.assoc(keys.chainEdit)
