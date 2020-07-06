import * as A from '@core/arena'

const keys = {
  chainEdit: 'chain-edit',
}

export const getChainEdit = () => {
  const chainEdit = window.localStorage.getItem(keys.chainEdit)
  return A.isEmpty(chainEdit) ? null : JSON.parse(chainEdit)
}

export const persistChainEdit = (chainEdit) => window.localStorage.setItem(keys.chainEdit, JSON.stringify(chainEdit))

export const removeChainEdit = () => window.localStorage.removeItem(keys.chainEdit)
