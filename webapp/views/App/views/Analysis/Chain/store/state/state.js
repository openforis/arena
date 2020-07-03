import * as R from 'ramda'

export const keys = {
  attributesUuidsOtherChains: 'attributesUuidsOtherChains',

  chain: 'chain',
  editingChain: 'editingChain',
  dirty: 'dirty',

  step: 'step',
  editingStep: 'editingStep',
  stepDirty: 'stepDirty',

  calculation: 'calculation',
  editingCalculation: 'editingCalculation',
  calculationDirty: 'calculationDirty',
}

const isNotNullAndNotEmpty = (item) => !(R.isNil(item) || R.isEmpty(item))

// ==== CREATE

export const create = ({
  attributesUuidsOtherChains,
  chainState,
  ChainState,
  stepState,
  StepState,
  calculationState,
  CalculationState,
}) => {
  const { chain, dirty } = ChainState.get(chainState)
  const { step, stepDirty } = StepState.get(stepState)
  const { calculation, calculationDirty } = CalculationState.get(calculationState)

  return {
    attributesUuidsOtherChains,

    chain,
    editingChain: isNotNullAndNotEmpty(chain),
    dirty,

    step,
    editingStep: isNotNullAndNotEmpty(step),
    stepDirty,

    calculation,
    editingCalculation: isNotNullAndNotEmpty(calculation),
    calculationDirty,
  }
}

// ==== READ
export const getAttributesUuidsOtherChains = (state) => state[keys.attributesUuidsOtherChains]

export const getChain = (state) => state[keys.chain]
export const getEditingChain = (state) => isNotNullAndNotEmpty(state[keys.chain])
export const getDirty = (state) => state[keys.dirty]

export const getStep = (state) => state[keys.step]
export const getEditingStep = (state) => isNotNullAndNotEmpty(state[keys.step])
export const getStepDirty = (state) => state[keys.stepDirty]

export const getCalculation = (state) => state[keys.calculation]
export const getEditingCalculation = (state) => isNotNullAndNotEmpty(state[keys.calculation])
export const getCalculationDirty = (state) => state[keys.calculationDirty]

export const get = (state) => ({
  [keys.attributesUuidsOtherChains]: getAttributesUuidsOtherChains(state),

  [keys.chain]: getChain(state),
  [keys.editingChain]: getEditingChain(state),
  [keys.dirty]: getDirty(state),

  [keys.step]: getStep(state),
  [keys.editingStep]: getEditingStep(state),
  [keys.stepDirty]: getStepDirty(state),

  [keys.calculation]: getCalculation(state),
  [keys.editingCalculation]: getEditingCalculation(state),
  [keys.calculationDirty]: getCalculationDirty(state),
})
