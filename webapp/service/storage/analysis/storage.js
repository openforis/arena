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

// ====== READ
export const getChain = () => {
  const chain = window.localStorage.getItem(keys.chain)
  if (chain) return JSON.parse(chain)
  return chain
}

export const getStep = () => {
  const step = window.localStorage.getItem(keys.step)
  const stepDirty = window.localStorage.getItem(keys.stepDirty)

  return {
    step: step ? JSON.parse(step) : {},
    stepDirty: stepDirty ? JSON.parse(stepDirty) : false,
  }
}

export const getCalculation = () => {
  const calculation = window.localStorage.getItem(keys.calculation)
  const calculationDirty = window.localStorage.getItem(keys.calculationDirty)

  return {
    calculation: calculation ? JSON.parse(calculation) : {},
    calculationDirty: calculationDirty ? JSON.parse(calculationDirty) : false,
  }
}

// ====== UPDATE
export const setChain = ({ chain }) => window.localStorage.setItem(keys.chain, JSON.stringify(chain))
export const setStep = ({ step, stepDirty }) => {
  window.localStorage.setItem(keys.step, JSON.stringify(step))
  window.localStorage.setItem(keys.stepDirty, JSON.stringify(stepDirty))
}
export const setCalculation = ({ calculation, calculationDirty }) => {
  window.localStorage.setItem(keys.calculation, JSON.stringify(calculation))
  window.localStorage.setItem(keys.calculationDirty, JSON.stringify(calculationDirty))
}
// ====== DELETE
export const removeChain = () => window.localStorage.removeItem(keys.chain)
export const removeStep = () => {
  window.localStorage.removeItem(keys.step)
  window.localStorage.removeItem(keys.stepDirty)
}
export const removeCalculation = () => {
  window.localStorage.removeItem(keys.calculation)
  window.localStorage.removeItem(keys.calculationDirty)
}
