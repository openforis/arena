const keys = {
  chain: 'chain',
}

export const eventTypes = {
  setChain: 'analysis/set-chain',
}

// ====== READ
export const getChain = () => {
  const chain = window.localStorage.getItem(keys.chain)
  if (chain) return JSON.parse(chain)
  return chain
}

// ====== UPDATE
export const setChain = ({ chain }) => window.localStorage.setItem(keys.chain, JSON.stringify(chain))

// ====== DELETE
export const clearChain = () => window.localStorage.removeItem(keys.chain)
