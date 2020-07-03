export const keys = {
  chain: 'chain',
  dirty: 'dirty',
}

// ==== CREATE
export const create = ({ chain, dirty }) => ({
  [keys.chain]: chain,
  [keys.dirty]: dirty,
})

// ==== READ
export const getChain = (state) => state[keys.chain]
export const getDirty = (state) => state[keys.dirty]

export const get = (state) => ({
  [keys.chain]: getChain(state),
  [keys.dirty]: getDirty(state),
})

// ==== UPDATE
export const assoc = (newProps) => (state) => ({
  [keys.chain]: Object.prototype.hasOwnProperty.call(newProps, keys.chain) ? newProps[keys.chain] : state[keys.chain],
  [keys.dirty]: Object.prototype.hasOwnProperty.call(newProps, keys.dirty) ? newProps[keys.dirty] : state[keys.dirty],
})
