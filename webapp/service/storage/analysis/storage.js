import * as R from 'ramda'

const keys = {
  chain: 'chain',
  step: 'step',
  stepDirty: 'stepDirty',
  calculation: 'calculation',
  calculationDirty: 'calculationDirty',
}

export const eventTypes = {
  setChain: 'analysis/set-chain',
  setStep: 'analysis/set-step',
  setCalculation: 'analysis/set-calculation',
}

const setItem = (key, value) => {
  if (!R.isNil(value)) {
    window.localStorage.setItem(key, JSON.stringify(value))
  }
}
const getItem = (key, defaultValue = null) => {
  const value = window.localStorage.getItem(key)
  return !R.isNil(value) ? JSON.parse(value) : defaultValue
}
const removeItem = (key) => window.localStorage.removeItem(key)

// ====== READ
export const getChain = () => getItem(keys.chain)

export const getStep = () => ({
  step: getItem(keys.step),
  stepDirty: getItem(keys.stepDirty),
})

export const getCalculation = () => ({
  calculation: getItem(keys.calculation),
  calculationDirty: getItem(keys.calculationDirty),
})

// ====== UPDATE
export const setChain = ({ chain }) => setItem(keys.chain, chain)
export const setStep = ({ step, stepDirty }) => {
  setItem(keys.step, step)
  setItem(keys.stepDirty, stepDirty)
}
export const setCalculation = ({ calculation, calculationDirty }) => {
  setItem(keys.calculation, calculation)
  setItem(keys.calculationDirty, calculationDirty)
}
// ====== DELETE
export const removeChain = () => removeItem(keys.chain)
export const removeStep = () => {
  removeItem(keys.step)
  removeItem(keys.stepDirty)
}
export const removeCalculation = () => {
  removeItem(keys.calculation)
  removeItem(keys.calculationDirty)
}
