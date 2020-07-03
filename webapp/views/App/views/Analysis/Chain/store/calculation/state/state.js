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
export const assoc = (newProps) => (state) => ({
  [keys.calculation]: Object.prototype.hasOwnProperty.call(newProps, keys.calculation)
    ? newProps[keys.calculation]
    : state[keys.calculation],
  [keys.calculationOriginal]: Object.prototype.hasOwnProperty.call(newProps, keys.calculationOriginal)
    ? newProps[keys.calculationOriginal]
    : state[keys.calculationOriginal],
  [keys.calculationDirty]: Object.prototype.hasOwnProperty.call(newProps, keys.calculationDirty)
    ? newProps[keys.calculationDirty]
    : state[keys.calculationDirty],
})
