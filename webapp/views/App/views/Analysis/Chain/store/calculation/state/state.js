import * as R from 'ramda'

export const keys = {
  calculation: 'calculation',
  calculationOriginal: 'calculationOriginal',
  calculationDirty: 'calculationDirty',
}

// ==== CREATE

export const create = ({ calculation, calculationOriginal, calculationDirty }) => ({
  [keys.calculation]: calculation,
  [keys.calculationOriginal]: calculationOriginal,
  [keys.calculationDirty]: calculationDirty,
})

// ==== READ
export const getCalculation = (state) => state[keys.calculation]
export const getCalculationOriginal = (state) => state[keys.calculationOriginal]
export const getCalculationDirty = (state) => state[keys.calculationDirty]

export const get = (state) => ({
  [keys.calculation]: getCalculation(state),
  [keys.calculationOriginal]: getCalculationOriginal(state),
  [keys.calculationDirty]: getCalculationDirty(state),
})

// ==== UPDATE
export const updateByKey = ({ key, value }) => (state) =>
  Object.keys(keys).includes(key) ? { ...state, [key]: value } : { ...state }

export const assoc = (newProps) => (state) => ({
  [keys.calculation]: R.isNil(newProps[keys.calculation]) ? state[keys.calculation] : newProps[keys.calculation],
  [keys.calculationOriginal]: R.isNil(newProps[keys.calculationOriginal])
    ? state[keys.calculationOriginal]
    : newProps[keys.calculationOriginal],
  [keys.calculationDirty]: R.isNil(newProps[keys.calculationDirty])
    ? state[keys.calculationDirty]
    : newProps[keys.calculationDirty],
})
