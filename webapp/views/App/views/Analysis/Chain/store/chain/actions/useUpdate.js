import * as Chain from '@common/analysis/processingChain'

export const useUpdate = ({ chain, setChain, setDirty }) => ({ name, value }) => {
  const chainUpdated = Chain.assocProp(name, value)(chain)
  setDirty(true)
  setChain(chainUpdated)
}
