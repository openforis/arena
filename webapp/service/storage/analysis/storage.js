const keys = {
  chain: 'chain',
  step: 'step',
  calculation: 'calculation',
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
  if (step) return JSON.parse(step)
  return step
}

export const getCalculation = () => {
  const calculation = window.localStorage.getItem(keys.calculation)
  if (calculation) return JSON.parse(calculation)
  return calculation
}

// ====== UPDATE
export const setChain = ({ chain }) => window.localStorage.setItem(keys.chain, JSON.stringify(chain))
export const setStep = ({ step }) => window.localStorage.setItem(keys.step, JSON.stringify(step))
export const setCalculation = ({ calculation }) =>
  window.localStorage.setItem(keys.calculation, JSON.stringify(calculation))
// ====== DELETE
export const clearChain = () => window.localStorage.removeItem(keys.chain)
export const clearStep = () => window.localStorage.removeItem(keys.step)
export const clearCalculation = () => window.localStorage.removeItem(keys.calculation)
