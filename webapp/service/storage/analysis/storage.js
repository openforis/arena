const keys = {
  chain: 'chain',
  step: 'step',
}

export const eventTypes = {
  setChain: 'analysis/set-chain',
  setStep: 'analysis/set-step',
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

// ====== UPDATE
export const setChain = ({ chain }) => window.localStorage.setItem(keys.chain, JSON.stringify(chain))
export const setStep = ({ step }) => window.localStorage.setItem(keys.step, JSON.stringify(step))
// ====== DELETE
export const clearChain = () => window.localStorage.removeItem(keys.chain)
export const clearStep = () => window.localStorage.removeItem(keys.step)
